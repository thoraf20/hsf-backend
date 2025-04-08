import { OfferLetterStatusEnum } from '@domain/enums/propertyEnum'
// import { Payment } from '@entities/Payment'
import { OfferLetter, PropertyClosing } from '@entities/PropertyPurchase'
// import { PaymentProcessorFactory } from '@infrastructure/services/factoryProducer'
// import { PaymentService } from '@infrastructure/services/paymentService.service'
import { IPaymentRespository } from '@interfaces/IpaymentRepository'
import { IPreQualify } from '@interfaces/IpreQualifyRepoitory'
import { IPurchaseProperty } from '@interfaces/IPropertyPurchaseRepository'
import { IPropertyRepository } from '@interfaces/IPropertyRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { generateTransactionId } from '@shared/utils/helpers'
import { PropertyBaseUtils } from '@use-cases/utils'
import { StatusCodes } from 'http-status-codes'

export class PropertyPurchase {
  private propertyRepository: IPropertyRepository
  private purchaseRepository: IPurchaseProperty
  private readonly preQualifieRepository: IPreQualify
  private readonly paymentRepository: IPaymentRespository
  private readonly utilsProperty: PropertyBaseUtils
  // private payment = new PaymentService(new PaymentProcessorFactory())
  constructor(
    purchaseRepository: IPurchaseProperty,
    propertyRepository: IPropertyRepository,
    preQualifieRepository: IPreQualify,
    paymentRepository: IPaymentRespository,
  ) {
    this.propertyRepository = propertyRepository
    this.purchaseRepository = purchaseRepository
    this.utilsProperty = new PropertyBaseUtils(this.propertyRepository)
    this.preQualifieRepository = preQualifieRepository
    this.paymentRepository = paymentRepository
  }

  public async checkoutDuplicate(property_id: string, user_id: string) {
    console.log(property_id)
    await this.utilsProperty.findIfPropertyExist(property_id)
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

  public async purchaseProperty(input: any, user_id: string) {
    if (input.request_type === 'Offer Letter') {
      return await this.requestForOfferLetter(
        input.property_id,
        input.purchase_type,
        user_id,
      )
    }
    if (input.request_type === 'Property Closing') {
      return await this.requestForPropertyClosing(input.property_id, user_id)
    }

    if (input.request_type === 'Escrow Attendance') {
      await this.confirnEscrowAttendanc(input.property_id, user_id)
      const property = await this.propertyRepository.findPropertyById(
        input.property_id,
      )
      const down_payment = (60 % Number(property.property_price)) * 100
      const outstanding_amount =
        Number(property.property_price) - Number(down_payment)
      const payment = await this.paymentRepository.createPayment({
        payment_type: input.purchase_type,
        payment_method: 'Bank',
        payment_status: 'Pending',
        amount: property.property_price,
        transaction_id: generateTransactionId(),
        total_closing: property.property_price,
        down_payment: down_payment.toString(),
        outstanding_amount: outstanding_amount.toString(),
      })
      const invoices = await this.paymentRepository.createInvoice({
        payment_id: payment.payment_id,
      })
  
      return { payment, invoices }
    }

   
  }

  public async confirnEscrowAttendanc(
    property_id: string,
    user_id: string,
  ): Promise<any> {
    await this.purchaseRepository.confirmPropertyEscrowMeeting(
      property_id,
      user_id,
    )
  }

  public async requestForPropertyClosing(
    property_id: string,
    user_id: string,
  ): Promise<PropertyClosing> {
    await this.utilsProperty.findIfPropertyExist(property_id)
    const Closing = await this.purchaseRepository.requestForPropertyClosing(
      property_id,
      user_id,
    )
    return Closing
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
          'You must pre-qualify for a loan before requesting an offer letter',
        )
      }

      const approvedPreQualify =
        await this.preQualifieRepository.getSuccessfulPrequalifyRequestByUser(
          user_id,
        )
      if (!approvedPreQualify) {
        throw new ApplicationCustomError(
          StatusCodes.BAD_REQUEST,
          'Your pre-qualification request has not been approved',
        )
      }
    }

    const offer_letter = await this.purchaseRepository.requestForOfferLetter({
      property_id: property_id,
      user_id,
      offer_letter_requested: true,
      purchase_type: purchase_type,
    })

    return offer_letter
  }


  public async getOfferLetterById(offer_letter_id: string): Promise<OfferLetter> {
      const offer_letter = await this.purchaseRepository.getOfferLetterById(offer_letter_id)
      return offer_letter
  }

  public async getAllOfferLetterByUserId(user_id: string): Promise<OfferLetter[]>  {
      const offerLetter = await this.purchaseRepository.getAllOfferLetterByUserId(user_id)
      return offerLetter
  }

  public async getAllOfferLetter(): Promise<OfferLetter[]>  {
      const offerLetter = await this.purchaseRepository.getOfferLetter()
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
