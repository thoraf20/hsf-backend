import { OfferLetterStatusEnum } from '@domain/enums/propertyEnum'
// import { Payment } from '@entities/Payment'
import {
  EscrowInformationStatus,
  OfferLetter,
  PropertyClosing,
} from '@entities/PropertyPurchase'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'

// import { PaymentProcessorFactory } from '@infrastructure/services/factoryProducer'
// import { PaymentService } from '@infrastructure/services/paymentService.service'
import { IPaymentRespository } from '@interfaces/IpaymentRepository'
import { IPreQualify } from '@interfaces/IpreQualifyRepoitory'
import { IPurchaseProperty } from '@interfaces/IPropertyPurchaseRepository'
import { IPropertyRepository } from '@interfaces/IPropertyRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { ApplicationError } from '@shared/utils/error'
// import { generateTransactionId } from '@shared/utils/helpers'
import { PropertyBaseUtils } from '@use-cases/utils'
import { StatusCodes } from 'http-status-codes'

export class PropertyPurchase {
  private propertyRepository: IPropertyRepository
  private purchaseRepository: IPurchaseProperty
  private  applicationRepository: IApplicationRespository
  private readonly preQualifieRepository: IPreQualify
  // private readonly paymentRepository: IPaymentRespository
  private readonly utilsProperty: PropertyBaseUtils
  // private payment = new PaymentService(new PaymentProcessorFactory())
  constructor(
    purchaseRepository: IPurchaseProperty,
    propertyRepository: IPropertyRepository,
    preQualifieRepository: IPreQualify,
    paymentRepository: IPaymentRespository,
    applicationRepository: IApplicationRespository,
  ) {
    this.propertyRepository = propertyRepository
    this.purchaseRepository = purchaseRepository
    this.applicationRepository = applicationRepository
    this.utilsProperty = new PropertyBaseUtils(this.propertyRepository)
    this.preQualifieRepository = preQualifieRepository

    // this.paymentRepository = paymentRepository
  }

  public async checkoutDuplicate(property_id: string, user_id: string) {
    console.log(property_id)
    await this.utilsProperty.getIfPropertyExist(property_id)
    const [alreadyApprovedAndSoldOut, PendingRequest] = await Promise.all([
      this.purchaseRepository.checkIfRequestForOfferLetterIsApproved(
        property_id,
      ),
      this.purchaseRepository.checkIfRequestForOfferLetter(
        property_id,
        user_id,
      ),
    ])

    if (alreadyApprovedAndSoldOut) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'This property Has already been sold',
      )
    }

    if (PendingRequest) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Your request is under review',
      )
    }
  }

  public async checkIfPropertyClosingExist(
    property_id: string,
    user_id: string,
  ) {
    const Closing =
      await this.purchaseRepository.checkIfPropertyClosingIsRequested(
        property_id,
        user_id,
      )
    if (Closing) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        `Your property purchase is still ${Closing.closing_status}`,
      )
    }
  }

  public async purchaseProperty(input: any, user_id: string) {
    await this.utilsProperty.getIfPropertyExist(input.property_id)
    if (input.request_type === 'Offer Letter') {
      return await this.requestForOfferLetter(
        input.property_id,
        input.purchase_type,
        user_id,
      )
    }
    if (input.request_type === 'Property Closing') {
      await this.checkIfPropertyClosingExist(input.property_id, user_id)
      return await this.requestForPropertyClosing(input.property_id, user_id)
    }

    console.log({ input, user_id })
    if (input.request_type === 'Escrow Attendance') {
      if (!input.escrow_id) {
        throw new ApplicationError(
          'escrow_status_id is required',
          StatusCodes.BAD_REQUEST,
        )
      }

      await this.confirnEscrowAttendanc(input.escrow_id)
    }
  }

  public async confirnEscrowAttendanc(escrowId: string): Promise<any> {
    await this.purchaseRepository.confirmPropertyEscrowMeeting(escrowId)
  }

  public async requestForPropertyClosing(
    property_id: string,
    user_id: string,
  ): Promise<PropertyClosing> {
    const Closing = await this.purchaseRepository.requestForPropertyClosing(
      property_id,
      user_id,
    )
    await this.applicationRepository.updateApplication({property_id, property_closing_id: Closing.property_closing_id, user_id})
    return Closing
  }

  public async escrowStatus(
    input: EscrowInformationStatus,
    user_id: string,
  ): Promise<EscrowInformationStatus> {
 const status = await this.purchaseRepository.createEscrowStatus({
      ...input,
      user_id,
    })
    return status
  }
  public async requestForOfferLetter(
    property_id: string,
    purchase_type: OfferLetterStatusEnum,
    user_id: string,
  ): Promise<OfferLetter> {
    await this.checkoutDuplicate(property_id, user_id)

    const isOutright = purchase_type === OfferLetterStatusEnum.OUTRIGHT

    if (!isOutright) {
      const preQualified =
        await this.preQualifieRepository.findIfApplyForLoanAlready(user_id)
      if (!preQualified) {
        throw new ApplicationCustomError(
          StatusCodes.NOT_FOUND,
          'Send request to be prequalified',
        )
      }
    }

    const offer_letter = await this.purchaseRepository.requestForOfferLetter({
      property_id: property_id,
      user_id,
      offer_letter_requested: true,
      purchase_type: purchase_type,
    })
    const application = await this.applicationRepository.getIfApplicationIsRecorded(property_id, user_id)
    if(application) {
      await this.applicationRepository.updateApplication({ property_id, offer_letter_id: offer_letter.offer_letter_id, user_id})
     } 
     await this.applicationRepository.createApplication({application_type: purchase_type, property_id, offer_letter_id: offer_letter.offer_letter_id, user_id})
    return offer_letter
  }

  public async getOfferLetterById(
    offer_letter_id: string,
  ): Promise<OfferLetter> {
    const offer_letter =
      await this.purchaseRepository.getOfferLetterById(offer_letter_id)
    if (!offer_letter) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        `offer letter is not found`,
      )
    }
    return offer_letter
  }

  public async getAllOfferLetterByUserId(
    user_id: string,
  ): Promise<OfferLetter[]> {
    const offerLetter =
      await this.purchaseRepository.getAllOfferLetterByUserId(user_id)
    return offerLetter
  }

  public async getAllOfferLetter(user_id: string): Promise<OfferLetter[]> {
    const offerLetter = await this.purchaseRepository.getOfferLetter(user_id)
    return offerLetter
  }

  // public async makePayment(
  //   input: Payment,
  //   paymentType: string,
  //   user_id: string,
  //   property_id: string,
  // ): Promise<void> {
  //   let transactionData = {}

  //   const transaction_id = generateTransactionId()
  //   if (paymentType === 'Pay-Due-Deligence') {
  //     const payment = await this.paymentRepository.createPayment({
  //       payment_type: paymentType,
  //       property_id,
  //       user_id,
  //       payment_status: 'pending',
  //       amount: input.amount,
  //       transaction_id,
  //     })
  //     this.paymentRepository.createInvoice({
  //       tax: 0,
  //       payment_id: payment.payment_id,
  //     })
  //     const paymentProviders = await this.payment.makePayment(
  //       input.paymentMethod,
  //       {
  //         amount: input.amount,
  //         email: input.email,
  //         metaData: { paymentType, user_id, transaction_id },
  //       },
  //     )

  //     transactionData = paymentProviders
  //   } else if (paymentType === 'Brokrage Plan') {
  //     const payment = await this.paymentRepository.createPayment({
  //       payment_type: paymentType,
  //       property_id,
  //       user_id,
  //       payment_status: 'pending',
  //       amount: input.amount,
  //       transaction_id,
  //     })
  //     this.paymentRepository.createInvoice({
  //       tax: 0,
  //       payment_id: payment.payment_id,
  //     })
  //     const paymentProviders = await this.payment.makePayment(
  //       input.paymentMethod,
  //       {
  //         amount: input.amount,
  //         email: input.email,
  //         metaData: { paymentType, user_id, transaction_id },
  //       },
  //     )

  //     transactionData = paymentProviders
  //   } else if (paymentType === 'Management Fee') {
  //     const payment = await this.paymentRepository.createPayment({
  //       payment_type: paymentType,
  //       property_id,
  //       user_id,
  //       payment_status: 'pending',
  //       amount: input.amount,
  //       transaction_id,
  //     })
  //     this.paymentRepository.createInvoice({
  //       tax: 0,
  //       payment_id: payment.payment_id,
  //     })
  //     const paymentProviders = await this.payment.makePayment(
  //       input.paymentMethod,
  //       {
  //         amount: input.amount,
  //         email: input.email,
  //         metaData: { paymentType, user_id, transaction_id },
  //       },
  //     )

  //     transactionData = paymentProviders
  //   }
  // }
}
