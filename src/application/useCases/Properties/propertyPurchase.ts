import { OfferLetterStatusEnum, PurchaseEnum } from '@domain/enums/propertyEnum'
// import { Payment } from '@entities/Payment'
import {
  EscrowInformationStatus,
  OfferLetter,
  PropertyClosing,
} from '@entities/PropertyPurchase'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'
import { IMortageRespository } from '@interfaces/IMortageRespository'

// import { PaymentProcessorFactory } from '@infrastructure/services/factoryProducer'
// import { PaymentService } from '@infrastructure/services/paymentService.service'
import { IPaymentRespository } from '@interfaces/IpaymentRepository'
import { IPreQualify } from '@interfaces/IpreQualifyRepoitory'
import { IPurchaseProperty } from '@interfaces/IPropertyPurchaseRepository'
import { IPropertyRepository } from '@interfaces/IPropertyRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { ApplicationError } from '@shared/utils/error'
import { generateTransactionId } from '@shared/utils/helpers'
// import { generateTransactionId } from '@shared/utils/helpers'
import { PropertyBaseUtils } from '@use-cases/utils'
import { StatusCodes } from 'http-status-codes'

export class PropertyPurchase {
  private propertyRepository: IPropertyRepository
  private purchaseRepository: IPurchaseProperty
  private applicationRepository: IApplicationRespository
  private readonly preQualifieRepository: IPreQualify
  private readonly mortgageRespository: IMortageRespository
  // private readonly paymentRepository: IPaymentRespository
  private readonly utilsProperty: PropertyBaseUtils
  // private payment = new PaymentService(new PaymentProcessorFactory())
  constructor(
    purchaseRepository: IPurchaseProperty,
    propertyRepository: IPropertyRepository,
    preQualifieRepository: IPreQualify,
    paymentRepository: IPaymentRespository,
    applicationRepository: IApplicationRespository,
    morgageRepository: IMortageRespository,
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
    const transaction_id = generateTransactionId()
    if (input.request_type === PurchaseEnum.OfferLetter) {
      return await this.requestForOfferLetter(
        input.property_id,
        input.purchase_type,
        user_id,
      )
    }
    if (input.request_type === PurchaseEnum.PROPERTY_CLOSSING) {
      await this.checkIfPropertyClosingExist(input.property_id, user_id)
      return await this.requestForPropertyClosing(input.property_id, user_id)
    }

    if (input.request_type === PurchaseEnum.ESCROW_ATTENDANCE) {
      if (!input.escrow_id) {
        throw new ApplicationError(
          'escrow_status_id is required',
          StatusCodes.BAD_REQUEST,
        )
      }
      await this.confirnEscrowAttendanc(input.escrow_id)
    }

    if (input.request_type === PurchaseEnum.ACCEPT_DIP) {
      if (!input.dip_status) {
        throw new ApplicationCustomError(
          StatusCodes.BAD_REQUEST,
          `dip_status is required`,
        )
      }
      const dip = await this.mortgageRespository.acceptDip({
        dip_status: input.dip_status,
        property_id: input.property_id,
        user_id,
      })
      await this.applicationRepository.createApplication({
        application_type: input.purchase_type,
        property_id: input.property_id,
        dip_id: dip.dip_id,
        user_id,
      })
    }

    if (
      input.request_type === PurchaseEnum.DUE_DELIGENT ||
      input.request_type === PurchaseEnum.BROKER_FEE ||
      input.purchase_type === PurchaseEnum.MANAGEMENT_FEE
    ) {
      if (!input.email) {
        throw new ApplicationCustomError(
          StatusCodes.BAD_REQUEST,
          `email is required`,
        )
      }
      const metaData = {
        paymentType: input.request_type,
        user_id,
        transaction_id,
      }
      return await this.mortgageRespository.payForMortageProcess(
        { email: input.email },
        metaData,
        input.request_type,
        user_id,
        transaction_id,
        input.property_id,
      )
    }

    if (input.request_type === PurchaseEnum.DOCUMENT_UPLOAD) {
      if (!input.documents) {
        throw new ApplicationCustomError(
          StatusCodes.BAD_REQUEST,
          `documents is required`,
        )
      }
      const mortage = await this.mortgageRespository.uploadDocument({
        documents: JSON.stringify(input.documents),
        user_id,
        property_id: input.property_id,
      })
      await this.applicationRepository.updateApplication({
        property_id: input.property_id,
        document_upload_id: mortage.document_upload_id,
        user_id,
      })
    }
    if (input.request_type === PurchaseEnum.PRECEDENT_DOC) {
      if (!input.documents) {
        throw new ApplicationCustomError(
          StatusCodes.BAD_REQUEST,
          `documents is required`,
        )
      }
      const mortage = await this.mortgageRespository.uploadPrecedentDocument({
        precedent_documents: JSON.stringify(input.documents),
        user_id,
        property_id: input.property_id,
      })
      await this.applicationRepository.updateApplication({
        property_id: input.property_id,
        document_upload_id: mortage.precedent_document_upload_id,
        user_id,
      })
    }
    if (input.request_type === PurchaseEnum.ACCEPT_LOAN) {
      if(!input.loan_acceptance_status) {
          throw new ApplicationCustomError(
            StatusCodes.BAD_REQUEST,
            `loan_acceptance_status is required`,
          )
      }
      const findLoan = await this.mortgageRespository.getLoanOfferById(input.property_id, user_id)
      if(!findLoan) {
        throw new ApplicationCustomError(StatusCodes.BAD_REQUEST, `You have not been offered loan`)
      }

      await this.mortgageRespository.updateLoanOffer(input.loan_acceptance_status, input.property_id, user_id)
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
    await this.applicationRepository.updateApplication({
      property_id,
      property_closing_id: Closing.property_closing_id,
      user_id,
    })
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

    const isOutright =
      purchase_type === OfferLetterStatusEnum.OUTRIGHT ||
      OfferLetterStatusEnum.Mortgage

    if (!isOutright) {
      const preQualified =
        await this.preQualifieRepository.findIfApplyForLoanAlready(user_id)
      if (!preQualified) {
        throw new ApplicationCustomError(
          StatusCodes.NOT_FOUND,
          preQualified
            ? 'You have to be prequalify before proceeding'
            : 'Your prequalification is still under review',
        )
      }
    }

    const offer_letter = await this.purchaseRepository.requestForOfferLetter({
      property_id: property_id,
      user_id,
      offer_letter_requested: true,
      purchase_type: purchase_type,
    })
    const application =
      await this.applicationRepository.getIfApplicationIsRecorded(
        property_id,
        user_id,
      )
    if (application) {
      await this.applicationRepository.updateApplication({
        property_id,
        offer_letter_id: offer_letter.offer_letter_id,
        user_id,
      })
    }
    await this.applicationRepository.createApplication({
      application_type: purchase_type,
      property_id,
      offer_letter_id: offer_letter.offer_letter_id,
      user_id,
    })
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
}
