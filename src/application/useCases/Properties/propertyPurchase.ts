import {
  FinancialOptionsEnum,
  OfferLetterStatusEnum,
  PurchaseEnum,
} from '@domain/enums/propertyEnum'
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
    mortgageRepository: IMortageRespository,
  ) {
    this.propertyRepository = propertyRepository
    this.purchaseRepository = purchaseRepository
    this.applicationRepository = applicationRepository
    this.utilsProperty = new PropertyBaseUtils(this.propertyRepository)
    this.mortgageRespository = mortgageRepository
    this.preQualifieRepository = preQualifieRepository

    // this.paymentRepository = paymentRepository
  }

  public async checkoutDuplicate(property_id: string, user_id: string) {
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
    const transaction_id = generateTransactionId()
    if (
      purchase_type === FinancialOptionsEnum.OUTRIGHT ||
      purchase_type === FinancialOptionsEnum.INSTALLMENT
    ) {
      switch (request_type) {
        case PurchaseEnum.OfferLetter:
          return await this.requestForOfferLetter(
            property_id,
            purchase_type,
            user_id,
          )

        case PurchaseEnum.PROPERTY_CLOSSING:
          await this.checkIfPropertyClosingExist(property_id, user_id)
          return await this.requestForPropertyClosing(property_id, user_id)

        case PurchaseEnum.ESCROW_ATTENDANCE:
          return await this.confirmEscrowAttendanc(escrow_id)

        default:
          return
      }
    }

    // MORTGAGE flow
    if (purchase_type === FinancialOptionsEnum.MORTGAGE) {
      switch (request_type) {
        case PurchaseEnum.ACCEPT_DIP:
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

        case PurchaseEnum.DUE_DELIGENT:
        case PurchaseEnum.BROKER_FEE:
        case PurchaseEnum.MANAGEMENT_FEE:
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

        case PurchaseEnum.DOCUMENT_UPLOAD:
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

        case PurchaseEnum.PRECEDENT_DOC:
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

        case PurchaseEnum.ACCEPT_LOAN:
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
            loan_acceptance_status,
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
