import {
  ApplicationStatus,
  OfferLetterStatusEnum,
  PropertyRequestTypeEnum,
} from '@domain/enums/propertyEnum'
// import { Payment } from '@entities/Payment'
import {
  EscrowInformationStatus,
  OfferLetter,
  PropertyClosing,
} from '@entities/PropertyPurchase'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'
import { IInspectionRepository } from '@interfaces/IInspectionRepository'
import { IMortageRespository } from '@interfaces/IMortageRespository'

// import { PaymentProcessorFactory } from '@infrastructure/services/factoryProducer'
// import { PaymentService } from '@infrastructure/services/paymentService.service'
import { IPaymentRespository } from '@interfaces/IpaymentRepository'
import { IPreQualify } from '@interfaces/IpreQualifyRepoitory'
import { IPurchaseProperty } from '@interfaces/IPropertyPurchaseRepository'
import { IPropertyRepository } from '@interfaces/IPropertyRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { ErrorCode } from '@shared/utils/error'
import { generateTransactionId } from '@shared/utils/helpers'
// import { generateTransactionId } from '@shared/utils/helpers'
import { PropertyBaseUtils } from '@use-cases/utils'
import { PurchasePropertyInput } from '@validators/purchaseValidation'
import { StatusCodes } from 'http-status-codes'

export class PropertyPurchase {
  private propertyRepository: IPropertyRepository
  private purchaseRepository: IPurchaseProperty
  private applicationRepository: IApplicationRespository
  private readonly preQualifieRepository: IPreQualify
  private readonly mortgageRespository: IMortageRespository
  private readonly inspectionRespository: IInspectionRepository
  // private readonly paymentRepository: IPaymentRespository
  private readonly utilsProperty: PropertyBaseUtils
  // private payment = new PaymentService(new PaymentProcessorFactory())
  constructor(
    purchaseRepository: IPurchaseProperty,
    propertyRepository: IPropertyRepository,
    preQualifieRepository: IPreQualify,
    paymentRepository: IPaymentRespository,
    applicationRepository: IApplicationRespository,
    mortgageRepository: IMortageRespository,
    inspectionRespository: IInspectionRepository,
  ) {
    this.propertyRepository = propertyRepository
    this.purchaseRepository = purchaseRepository
    this.applicationRepository = applicationRepository
    this.inspectionRespository = inspectionRespository
    this.utilsProperty = new PropertyBaseUtils(this.propertyRepository)
    this.mortgageRespository = mortgageRepository
    this.preQualifieRepository = preQualifieRepository

    // this.paymentRepository = paymentRepository
  }

  public async checkoutDuplicate(property_id: string, user_id: string) {
    const [property, PendingRequest] = await Promise.all([
      this.utilsProperty.getIfPropertyExist(property_id),
      this.purchaseRepository.checkIfRequestForOfferLetter(
        property_id,
        user_id,
      ),
    ])

    if (property.is_sold) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'This property Has already been sold',
      )
    }

    if (PendingRequest) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
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

  public async purchaseProperty(
    input: PurchasePropertyInput,
    user_id: string,
  ): Promise<any> {
    const {
      property_id,
      purchase_type,
      request_type,
      email,
      documents,
      dip_status,
      escrow_id,
      loan_acceptance_status,
    } = input

    await this.utilsProperty.getIfPropertyExist(property_id)
    //application start process for morgage and installment

    const inspection =
      await this.inspectionRespository.getAlreadySchedulesInspection(
        property_id,
        user_id,
      )

    const application =
      await this.applicationRepository.getIfApplicationIsRecorded(
        property_id,
        user_id,
      )

    if (
      application &&
      !(
        application.status === ApplicationStatus.PENDING ||
        application.status === ApplicationStatus.PROCESSING
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Application is not in pending or processing status',
      )
    }

    if (
      !application &&
      request_type === PropertyRequestTypeEnum.ELIGIBILITY_CHECK
    ) {
      if (
        !(
          purchase_type === OfferLetterStatusEnum.INSTALLMENT ||
          purchase_type === OfferLetterStatusEnum.Mortgage
        )
      ) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'eligibility application not available for the selected purchase type',
          null,
        )
      }

      return this.applyEligibleCheck({
        property_id,
        purchase_type,
        user_id,
        inspection_id: inspection?.id,
      })
    }

    if (!application && request_type === PropertyRequestTypeEnum.INITIATE) {
      if (purchase_type !== OfferLetterStatusEnum.OUTRIGHT) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'Initiate request only available for outright purchase',
        )
      }

      return await this.applicationRepository.createApplication({
        status: ApplicationStatus.PENDING,
        property_id,
        user_id,
        application_type: purchase_type,
        inspection_id: inspection?.id,
      })
    }

    if (!application) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found or initiate',
      )
    }

    if (
      purchase_type === OfferLetterStatusEnum.OUTRIGHT ||
      purchase_type === OfferLetterStatusEnum.INSTALLMENT
    ) {
      switch (request_type) {
        case PropertyRequestTypeEnum.OfferLetter:
          return await this.requestForOfferLetter({
            property_id,
            purchase_type,
            user_id,
            application_id: application?.application_id,
          })

        case PropertyRequestTypeEnum.PROPERTY_CLOSSING:
          await this.checkIfPropertyClosingExist(property_id, user_id)
          return await this.requestForPropertyClosing(
            property_id,
            user_id,
            application?.application_id,
          )

        case PropertyRequestTypeEnum.ESCROW_ATTENDANCE:
          return await this.confirmEscrowAttendanc(escrow_id)

        default:
          return
      }
    }

    // MORTGAGE flow
    if (purchase_type === OfferLetterStatusEnum.Mortgage) {
      switch (request_type) {
        case PropertyRequestTypeEnum.ACCEPT_DIP:
          const dip = await this.mortgageRespository.acceptDip({
            dip_status,
            property_id,
            user_id,
          })
          await this.applicationRepository.updateApplication({
            property_id,
            document_upload_id: dip.dip_id,
            user_id,
          })
          return dip

        case PropertyRequestTypeEnum.DUE_DELIGENT:
        case PropertyRequestTypeEnum.BROKER_FEE:
        case PropertyRequestTypeEnum.MANAGEMENT_FEE:
          const transaction_id = generateTransactionId()

          const metaData = {
            paymentType: request_type,
            user_id,
            transaction_id,
          }
          return await this.mortgageRespository.payForMortageProcess(
            { amount: '100000', email },
            metaData,
            request_type,
            user_id,
            transaction_id,
            property_id,
          )

        case PropertyRequestTypeEnum.DOCUMENT_UPLOAD:
          const documentUpload = await this.mortgageRespository.uploadDocument({
            documents: JSON.stringify(documents),
            user_id,
            property_id,
            document_type: input.request_type,
          })
          await this.applicationRepository.updateApplication({
            property_id,
            document_upload_id: documentUpload.document_upload_id,
            user_id,
          })
          return documentUpload

        case PropertyRequestTypeEnum.PRECEDENT_DOC:
          const precedentUpload =
            await this.mortgageRespository.uploadPrecedentDocument({
              precedent_documents: JSON.stringify(documents),
              user_id,
              property_id,
              precedent_document_type: input.request_type,
            })
          await this.applicationRepository.updateApplication({
            property_id,
            document_upload_id: precedentUpload.precedent_document_upload_id,
            user_id,
          })
          return precedentUpload

        case PropertyRequestTypeEnum.ACCEPT_LOAN:
          const loanOffer = await this.mortgageRespository.getLoanOfferById(
            property_id,
            user_id,
          )
          if (!loanOffer) {
            throw new ApplicationCustomError(
              StatusCodes.BAD_REQUEST,
              `You have not been offered loan`,
            )
          }
          await this.mortgageRespository.updateLoanOffer(
            { loan_acceptance_status },
            property_id,
            user_id,
          )
          return

        default:
          return
      }
    }
  }

  public async confirmEscrowAttendanc(escrowId: string): Promise<any> {
    await this.purchaseRepository.confirmPropertyEscrowMeeting(escrowId)
  }

  public async requestForPropertyClosing(
    property_id: string,
    user_id: string,
    application_id: string,
  ): Promise<PropertyClosing> {
    const Closing = await this.purchaseRepository.requestForPropertyClosing(
      property_id,
      user_id,
    )

    await this.applicationRepository.updateApplication({
      application_id,
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

  public async applyEligibleCheck({
    property_id,
    purchase_type,
    user_id,
    inspection_id,
  }: {
    property_id: string
    purchase_type: OfferLetterStatusEnum

    user_id: string
    inspection_id: string
  }) {
    const preQualify =
      await this.preQualifieRepository.getPreQualifyRequestByUser(user_id)

    if (!preQualify) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You have to be prequalify before proceeding',
        null,
        ErrorCode.MISSING_PREQUALIFIER,
      )
    }

    let application =
      await this.applicationRepository.getIfApplicationIsRecorded(
        property_id,
        user_id,
      )

    if (application) {
      if (
        application.status === ApplicationStatus.PENDING ||
        application.status === ApplicationStatus.PROCESSING
      ) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'You have an active application ongoing',
        )
      }

      if (application.status === ApplicationStatus.COMPLETED) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'Your application has been completed',
        )
      }

      if (application.status === ApplicationStatus.REJECTED) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'Your application has been rejected',
        )
      }
    }

    const eligible = await this.preQualifieRepository.addEligibility({
      prequalify_status_id: preQualify.status_id,
      property_id,
      user_id,
      financial_eligibility_type: purchase_type,
    })

    application = await this.applicationRepository.createApplication({
      status: ApplicationStatus.PENDING,
      property_id,
      user_id,
      inspection_id,

      eligibility_id: eligible.eligibility_id,
      application_type: purchase_type,
      prequalifier_id: preQualify.status_id,
    })

    return application
  }

  public async requestForOfferLetter({
    property_id,
    purchase_type,
    user_id,
    application_id,
  }: {
    property_id: string
    purchase_type: OfferLetterStatusEnum
    user_id: string
    application_id: string
  }): Promise<OfferLetter> {
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

    await this.applicationRepository.updateApplication({
      application_id: application_id,
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
