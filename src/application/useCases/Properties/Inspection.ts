import { InspectionMeetingType } from '@domain/enums/propertyEnum'
import { Inspection } from '@domain/entities/Inspection'
import { IInspectionRepository } from '@domain/interfaces/IInspectionRepository'
import { InspectionBaseUtils } from '../utils'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import { PaymentProcessorFactory } from '@infrastructure/services/factoryProducer'
import { PaymentService } from '@infrastructure/services/paymentService.service'
import { ITransaction } from '@domain/interfaces/ITransactionRepository'
import { TransactionEnum } from '@domain/enums/transactionEnum'
import { generateTransactionId, syncToCalendar } from '@shared/utils/helpers'
import { SeekPaginationResult } from '@shared/types/paginate'
import { PaymentEnum, PaymentType } from '@domain/enums/PaymentEnum'
import emailTemplates from '@infrastructure/email/template/constant'
import db from '@infrastructure/database/knex'
export class InspectionService {
  private inspectionRepository: IInspectionRepository
  private utilsInspection: InspectionBaseUtils
  private payment = new PaymentService(new PaymentProcessorFactory())
  private transaction: ITransaction

  constructor(
    inspectionRepository: IInspectionRepository,
    transactions: ITransaction,
  ) {
    this.inspectionRepository = inspectionRepository
    this.utilsInspection = new InspectionBaseUtils(this.inspectionRepository)

    if (!transactions) {
      throw new Error('Transaction repository is required.')
    }
    this.transaction = transactions
  }

  public async ScheduleInspection(
    input: Inspection,
    user_id: string,
  ): Promise<Inspection | any> {
    await this.utilsInspection.findALreadyScheduledInspection(
      input.property_id,
      user_id,
    )
  
    const isVideoChat = input.inspection_meeting_type === InspectionMeetingType.VIDEO_CHAT
  
    if (isVideoChat && !input.payment_type) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        `Payment is required for ${InspectionMeetingType.VIDEO_CHAT}`,
      )
    }
  
    const trx = await db.transaction()
    let transactionData = {}
  
    try {
      const transaction_id = generateTransactionId()
  
      if (isVideoChat) {
        const [paymentResponse] = await Promise.all([
          this.payment.makePayment(PaymentEnum.PAYSTACK, {
            amount: 1000,
            email: input.email,
            metaData: { user_id, transaction_id, paymentType: PaymentType.INSPECTION},
          }),
          this.transaction.saveTransaction({
            user_id,
            transaction_type: PaymentType.INSPECTION,
            amount: 1000,
            status: TransactionEnum.PENDING,
            transaction_id,
          }),
        ])
        transactionData = paymentResponse
      }
  
      const { amount, payment_type, ...inspectionData } = input
  
      const scheduledInspection = await this.inspectionRepository.createInpection({
        ...inspectionData,
        meet_link: input.meet_link || '',
        user_id,
      }, trx)

      if (isVideoChat && input.meet_link && input.meeting_platform) {
        await syncToCalendar({
          platform: input.meeting_platform,
          meeting_link: input.meet_link,
          date: input.inspection_date,
          time: input.inspection_time,
          user_id,
        })
      }
      await this.sendEmailsWithRetry(input)
  
      await trx.commit()
  
      return { ...scheduledInspection, transactionData }
  
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
  
  private async sendEmailsWithRetry(input: Inspection, retries = 3, delay = 1000): Promise<void> {
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
            input.meet_link
          )
        }
  
         emailTemplates.sendScheduleInspectionInpersonEmail(
          input.email,
          input.full_name,
          input.inspection_date,
          input.inspection_time,
          input.inspection_meeting_type
        )
        return 
      } catch (err) {
        if (attempt === retries) throw err
        await new Promise(res => setTimeout(res, delay * attempt)) // exponential backoff
      }
    }
  }
  

  public async getInspectionSchedule(user_id: string): Promise<Inspection[]> {
    const Inspection =
      await this.inspectionRepository.getScheduleInspection(user_id)
    return Inspection
  }

  public async getAllInspectionByDeveloperId(
    dev_id: string,
  ): Promise<SeekPaginationResult<Record<string, any>>> {
    const Inspection =
      await this.inspectionRepository.getAllScheduleInspection(dev_id)
    return Inspection
  }

  public async getInspectionById(property_id: string): Promise<Inspection> {
    const inspection =
      await this.inspectionRepository.getScheduleInspectionById(property_id)
    return inspection
  }
}
