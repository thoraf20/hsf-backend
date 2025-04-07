import { OfferLetterStatusEnum } from '@domain/enums/propertyEnum'
import { Payment } from '@entities/Payment'
import { OfferLetter, PropertyClosing } from '@entities/PropertyPurchase'
import { PaymentProcessorFactory } from '@infrastructure/services/factoryProducer'
import { PaymentService } from '@infrastructure/services/paymentService.service'
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
  private payment = new PaymentService(new PaymentProcessorFactory())
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


  public async purchaseProperty(input: any, request_type: string, user_id: string) {
    if(request_type === 'Offer Letter') {
     return  await this.requestForOfferLetter(input.purchase_type, user_id)
    } else if(request_type === 'Property Closing') {
      return await this.requestForPropertyClosing(input.property_id, user_id)
    }
  }

  

  public async requestForPropertyClosing(property_id: string, user_id: string):Promise<PropertyClosing> {
    await this.utilsProperty.findIfPropertyExist(property_id)
    const propertyClosing = await this.purchaseRepository.requestForPropertyClosing(
      property_id,
      user_id,
    )
    return propertyClosing
  }
  public async requestForOfferLetter(
    input: OfferLetter,
    user_id: string,
  ): Promise<OfferLetter> {
    await this.checkoutDuplicate(input.property_id, user_id)

    const isOutright = input.purchase_type === OfferLetterStatusEnum.OUTRIGHT 

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

    const offerLetter = await this.purchaseRepository.requestForOfferLetter({
      property_id: input.property_id,
      user_id,
      offer_letter_requested: true,
      purchase_type: input.purchase_type,
    })

    return offerLetter
  }

  public async changeOfferLetterStatus(
    input: OfferLetter,
    user_id: string,
  ): Promise<void> {
    const offerLetter = await this.purchaseRepository.getOfferLetterById(
      input.offer_letter_id,
    )
    if (!offerLetter) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Offer letter not found',
      )
    }

    const preQualified =
      await this.preQualifieRepository.findIfApplyForLoanAlready(user_id)
    if (!preQualified) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'You must apply for a loan before changing the offer letter status',
      )
    }

    await this.purchaseRepository.updateOfferLetterStatus(
      input.offer_letter_id,
      { ...input },
    )
  }

  public async makePayment(
    input: Payment,
    paymentType: string,
    user_id: string,
    property_id: string,
  ): Promise<void> {
    let transactionData = {}

    const transaction_id = generateTransactionId()
    if (paymentType === 'Pay-Due-Deligence') {
      const payment = await this.paymentRepository.createPayment({
        payment_type: paymentType,
        property_id,
        user_id,
        payment_status: 'pending',
        amount: input.amount,
        transaction_id,
      })
      this.paymentRepository.createInvoice({
        tax: 0,
        payment_id: payment.payment_id,
      })
      const paymentProviders = await this.payment.makePayment(
        input.paymentMethod,
        {
          amount: input.amount,
          email: input.email,
          metaData: { paymentType, user_id, transaction_id },
        },
      )

      transactionData = paymentProviders
    } else if (paymentType === 'Brokrage Plan') {
      const payment = await this.paymentRepository.createPayment({
        payment_type: paymentType,
        property_id,
        user_id,
        payment_status: 'pending',
        amount: input.amount,
        transaction_id,
      })
      this.paymentRepository.createInvoice({
        tax: 0,
        payment_id: payment.payment_id,
      })
      const paymentProviders = await this.payment.makePayment(
        input.paymentMethod,
        {
          amount: input.amount,
          email: input.email,
          metaData: { paymentType, user_id, transaction_id },
        },
      )

      transactionData = paymentProviders
    } else if (paymentType === 'Management Fee') {
      const payment = await this.paymentRepository.createPayment({
        payment_type: paymentType,
        property_id,
        user_id,
        payment_status: 'pending',
        amount: input.amount,
        transaction_id,
      })
      this.paymentRepository.createInvoice({
        tax: 0,
        payment_id: payment.payment_id,
      })
      const paymentProviders = await this.payment.makePayment(
        input.paymentMethod,
        {
          amount: input.amount,
          email: input.email,
          metaData: { paymentType, user_id, transaction_id },
        },
      )

      transactionData = paymentProviders
    }
  }
}
