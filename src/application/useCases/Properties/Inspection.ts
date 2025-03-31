import { InspectionMeetingType } from '../../../domain/enums/propertyEnum';
import { Inspection } from '../../../domain/entities/Inspection';
import { IInspectionRepository } from '../../../domain/interfaces/IInspectionRepository';
import { InspectionBaseUtils } from '../utils';
import { ApplicationCustomError } from '../../../middleware/errors/customError';
import { StatusCodes } from 'http-status-codes';
import { PaymentProcessorFactory } from '../../../infrastructure/services/factoryProducer';
import { PaymentService } from '../../../infrastructure/services/paymentService.service';
import { ITransaction } from '../../../domain/interfaces/ITransactionRepository';
import { TransactionEnum } from '../../../domain/enums/transactionEnum';
import { generateTransactionId } from '../../../shared/utils/helpers';
import { PaymentEnum } from '../../../domain/enums/PaymentEnum';

export class InspectionService {
  private inspectionRepository: IInspectionRepository;
  private utilsInspection: InspectionBaseUtils;
  private payment = new PaymentService(new PaymentProcessorFactory());
  private transaction: ITransaction;

  constructor(inspectionRepository: IInspectionRepository, transactions: ITransaction) {
    this.inspectionRepository = inspectionRepository;
    this.utilsInspection = new InspectionBaseUtils(this.inspectionRepository);

    if (!transactions) {
      throw new Error("Transaction repository is required."); 
    }
    this.transaction = transactions;
  }

  public async ScheduleInspection(
    input: Inspection,
    user_id: string
  ): Promise<Inspection | any> {
    await this.utilsInspection.findALreadyScheduledInspection(input.property_id, user_id);

    // Validate payment_type
    if (!input.payment_type || !Object.values(PaymentEnum).includes(input.payment_type)) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        `Payment type is required and must be either ${Object.values(PaymentEnum).join(' or ')}`
      );
    }

    // Validate payment for VIDEO_CHAT inspections
    if (input.inspection_meeting_type === InspectionMeetingType.VIDEO_CHAT) {
      if (!input.amount || !input.payment_type) {
        throw new ApplicationCustomError(
          StatusCodes.BAD_REQUEST,
          `Payment is required for ${InspectionMeetingType.VIDEO_CHAT}`
        );
      }
    }

    let transactionData: any = {};
    
    if (input.inspection_meeting_type === InspectionMeetingType.VIDEO_CHAT) {
      const transaction_id = generateTransactionId();

      const [paymentResponse] = await Promise.all([
        this.payment.makePayment(input.payment_type, {
          amount: Number(input.amount),
          email: input.email,
          metaData: { user_id, transaction_id },
        }),
        this.transaction.saveTransaction({
          user_id,
          transaction_type: "Inspection",
          amount: input.amount,
          status: TransactionEnum.PENDING,
          transaction_id,
        }),
      ]);

      transactionData = paymentResponse;
    }

    // Exclude `amount` before saving to DB
    const { amount, payment_type, ...inspectionData } = input;

    const scheduledInspection = await this.inspectionRepository.createInpection({
      ...inspectionData,
      meet_link: '',
      user_id,
    });

    return { ...scheduledInspection, transactionData };
  }


  public async getInspectionSchedule(user_id: string): Promise<Inspection[]> {
    const Inspection =
      await this.inspectionRepository.getScheduleInspection(user_id)
    return Inspection
  }

  public async getAllInspectionByDeveloperId(
    dev_id: string,
  ): Promise<Inspection[]> {
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
