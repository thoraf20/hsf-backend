import { InspectionMeetingType, InspectionStatus } from '@domain/enums/propertyEnum'
import { Inspection } from '@domain/entities/Inspection'
import { IInspectionRepository } from '@domain/interfaces/IInspectionRepository'
import { InspectionBaseUtils } from '../utils'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import { PaymentProcessorFactory } from '@infrastructure/services/factoryProducer'
import { PaymentService } from '@infrastructure/services/paymentService.service'
import { ITransaction } from '@domain/interfaces/ITransactionRepository'
import { TransactionEnum } from '@domain/enums/transactionEnum'
import { generateTransactionId } from '@shared/utils/helpers'
import { SeekPaginationResult } from '@shared/types/paginate'
import { PaymentEnum, PaymentType } from '@domain/enums/PaymentEnum'
import emailTemplates from '@infrastructure/email/template/constant'
import db from '@infrastructure/database/knex'
import { v4 as uuidv4 } from 'uuid'
import { RedisClient } from '@infrastructure/cache/redisClient'
import { TimeSpan } from '@shared/utils/time-unit'
import { IServiceOfferingRepository } from '@interfaces/IServiceOfferingRepository'
import { ScheduleInspectionInput } from '@validators/inspectionVaidator'
import { createPendingInspectionCacheKey } from '@infrastructure/queue/inspectionQueue'
import { serviceProductFeeCodes } from '@infrastructure/config/serviceProductFeeCodes'
import { IManageInspectionRepository } from '@interfaces/Developer/IManageInspectionRepository'
export class InspectionService {
  private inspectionRepository: IInspectionRepository
  private serviceRepository: IServiceOfferingRepository
  private utilsInspection: InspectionBaseUtils
  private payment = new PaymentService(new PaymentProcessorFactory())
  private transaction: ITransaction
  private cache = new RedisClient()

  constructor(
    inspectionRepository: IInspectionRepository,
    serviceRepository: IServiceOfferingRepository,
    transactions: ITransaction,
    private readonly manageInspectionRepository: IManageInspectionRepository,
  ) {
    this.inspectionRepository = inspectionRepository
    this.serviceRepository = serviceRepository
    this.utilsInspection = new InspectionBaseUtils(this.inspectionRepository)
    this.manageInspectionRepository = manageInspectionRepository

    if (!transactions) {
      throw new Error('Transaction repository is required.')
    }
    this.transaction = transactions
  }

  public async ScheduleInspection(
    input: ScheduleInspectionInput,
    user_id: string,
  ): Promise<Inspection | any> {
    await this.utilsInspection.findALreadyScheduledInspection(
      input.property_id,
      user_id,
    )

    const trx = await db.transaction()

    const { ...inspectionData } = input
    const availability= await this.manageInspectionRepository.getDayAvailablitySlotById(
      input.availability_slot_id,
    )
    try {
      const
       pendingInspection: Partial<Inspection> = {
        contact_number: inspectionData.contact_number,
        inspection_date: inspectionData.inspection_date,
        inspection_time: inspectionData.inspection_time,
        inspection_fee_paid: null,
        user_id,
        full_name: inspectionData.full_name,
        email: inspectionData.email,
        meeting_platform: inspectionData.meeting_platform,
        property_id: inspectionData.property_id,
        day_availability_slot_id: availability.day_availability_slot_id,
        inspection_meeting_type: inspectionData.inspection_meeting_type,
        inspection_status: InspectionStatus.PENDING,
      }

      if (input.inspection_meeting_type === InspectionMeetingType.VIDEO_CHAT) {
        if (!(input.product_code && input.amount)) {
          throw new ApplicationCustomError(
            StatusCodes.BAD_REQUEST,
            `Product code and amount are required for ${InspectionMeetingType.VIDEO_CHAT}`,
          )
        }

        const inspectionFee = await this.serviceRepository.getByProductCode(
          input.product_code,
        )

        if (!inspectionFee) {
          throw new ApplicationCustomError(
            StatusCodes.BAD_REQUEST,
            `Product code not found`,
          )
        }

        if (
          inspectionFee.product_code !== serviceProductFeeCodes.INSPECTION_FEE
        ) {
          throw new ApplicationCustomError(
            StatusCodes.BAD_REQUEST,
            `Product code does not match inspection fee`,
          )
        }

        if (Number(inspectionFee.base_price) !== input.amount) {
          throw new ApplicationCustomError(
            StatusCodes.BAD_REQUEST,
            `Amount does not match product price`,
          )
        }

        const id = uuidv4()
        const key = createPendingInspectionCacheKey(id)

        await this.cache.setKey(
          key,
          pendingInspection,
          new TimeSpan(7, 'd').toMilliseconds(),
        )

        const transactionId = generateTransactionId()

        const paymentResponse = await this.payment.makePayment(
          PaymentEnum.PAYSTACK,
          {
            amount: Number(inspectionFee.base_price),
            email: input.email,
            metadata: {
              user_id,
              inspection_id: id,
              transaction_id: transactionId,
              paymentType: PaymentType.INSPECTION,
              product_code: inspectionFee.product_code,
              inspection: pendingInspection,
            },
          },
        )

        const transaction = await this.transaction.saveTransaction({
          user_id,
          transaction_type: PaymentType.INSPECTION,
          amount: Number(inspectionFee.base_price),
          property_id: input.property_id,
          reference: paymentResponse.reference,
          status: TransactionEnum.PENDING,
          transaction_id: transactionId,
        })

        return {
          id,
          ...pendingInspection,
          transactionData: { ...transaction, ...paymentResponse },
        }
      }

      const inspection = await this.inspectionRepository.createInpection(
        pendingInspection as Inspection,
      )

      await this.sendEmailsWithRetry(inspection)
      await trx.commit()

      return inspection
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async updateInspection(inspectionId: string, update: Partial<Inspection>) {
    return this.inspectionRepository.updateScheduleInpection(
      inspectionId,
      update,
    )
  }

  private async sendEmailsWithRetry(
    input: Inspection,
    retries = 3,
    delay = 1000,
  ): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (input.meet_link && input.meeting_platform) {
          emailTemplates.sendScheduleInspectionEmail(
            input.email,
            input.full_name,
            input.inspection_date,
            input.inspection_time,
            input.inspection_meeting_type,
            input.meeting_platform,
            input.meet_link,
          )
        }

        emailTemplates.sendScheduleInspectionInpersonEmail(
          input.email,
          input.full_name,
          input.inspection_date,
          input.inspection_time,
          input.inspection_meeting_type,
        )
        return
      } catch (err) {
        if (attempt === retries) throw err
        await new Promise((res) => setTimeout(res, delay * attempt)) // exponential backoff
      }
    }
  }

  public async getInspectionSchedule(user_id: string, action?: string): Promise<SeekPaginationResult<Record<string, any>>>{
    const Inspection =
      await this.inspectionRepository.getAllScheduleInspection(user_id, action)
    return Inspection
  }

  public async reponseToReschedule(
    inspection_id: string,
    payload: Partial<Inspection> | any,
  ): Promise<Inspection> {
    const inspection = await this.inspectionRepository.getScheduleInspectionById(
      inspection_id,
    )
    if (!inspection) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Inspection not found',
      )
    }
    const reschedule = await this.inspectionRepository.responseToReschedule(
      inspection_id,
      {confirm_avaliability_for_reschedule: payload.status, action: "scheduled"},
    )
    return reschedule
  }


  public async getInspectionById(schedule_id: string): Promise<Inspection> {
    const inspection =
      await this.inspectionRepository.getScheduleInspectionById(schedule_id)
    return inspection
  }
}
