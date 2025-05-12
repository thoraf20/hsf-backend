import {
  EligibilityStatus,
  preQualifyStatus,
} from '@domain/enums/prequalifyEnum'
import {
  ApplicationPurchaseType,
  ApplicationStatus,
  EscrowMeetingStatus,
  OfferLetterStatus,
  PropertyClosingStatus,
} from '@domain/enums/propertyEnum'
import {
  Eligibility,
  payment_calculator,
  preQualify,
} from '@entities/prequalify/prequalify'
import { EscrowInformationStatus } from '@entities/PropertyPurchase'
import { EscrowInformation } from '@entities/PurchasePayment'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { PrequalifyRepository } from '@repositories/prequalify/prequalifyRepository'
import { ApplicationRepository } from '@repositories/property/ApplicationRespository'
import { PropertyPurchaseRepository } from '@repositories/property/PropertyPurchaseRepository'
import { PropertyRepository } from '@repositories/property/PropertyRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { PropertyFilters } from '@shared/types/repoTypes'
import {
  CreateApplicationInput,
  RequestOfferLetterRespondInput,
  RequestPropertyClosingInput,
  ScheduleEscrowMeetingInput,
  ScheduleEscrowMeetingRespondInput,
} from '@validators/applicationValidator'
import { StatusCodes } from 'http-status-codes'

export class ApplicationService {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly propertyRepository: PropertyRepository,
    private readonly prequalifyRepository: PrequalifyRepository,
    private readonly purchaseRepository: PropertyPurchaseRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async create(userId: string, input: CreateApplicationInput) {
    const property = await this.propertyRepository.getPropertyById(
      input.property_id,
    )

    if (!(property && property.is_live)) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Property not found',
      )
    }

    if (property.is_sold) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Property not open for application',
      )
    }

    const lastApplication =
      await this.applicationRepository.getLastApplicationIfExist(
        input.property_id,
        userId,
      )

    if (
      lastApplication &&
      lastApplication.status !== ApplicationStatus.REJECTED
    ) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You have an ongoing application for the property',
      )
    }

    let preQualifier: preQualify | null = null

    if (input.purchase_type !== ApplicationPurchaseType.OUTRIGHT) {
      preQualifier =
        await this.prequalifyRepository.getPreQualifyRequestByUser(userId)

      if (!preQualifier) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'You are required to complete your prequalification form before any application to either installment or mortagage',
        )
      }

      if (preQualifier.status === preQualifyStatus.DELINCED) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'You need to refill your prequalification as your previous one was declined',
        )
      }
    }

    let eligibility: Eligibility | null = null

    if (
      input.purchase_type === ApplicationPurchaseType.OUTRIGHT ||
      input.purchase_type === ApplicationPurchaseType.Mortgage
    ) {
      eligibility = await this.prequalifyRepository.addEligibility({
        property_id: property.id,
        user_id: userId,
        eligiblity_status: EligibilityStatus.PENDING,
        financial_eligibility_type: input.purchase_type,
        prequalify_status_id: preQualifier.status_id,
      })
    }

    let installmentPaymentCalculator: payment_calculator | null = null
    if (input.purchase_type === ApplicationPurchaseType.INSTALLMENT) {
      installmentPaymentCalculator =
        await this.prequalifyRepository.storePaymentCalculator({
          ...(input.payment_calculator as payment_calculator),
          house_price: property.property_price,
          personal_information_id: preQualifier.personal_information_id,
          type: input.purchase_type,
        })

      console.log({ installmentPaymentCalculator })
    }

    const newApplication = await this.applicationRepository.createApplication({
      user_id: userId,
      status: ApplicationStatus.PENDING,
      property_id: property.id,
      prequalifier_id: preQualifier.status_id,
      application_type: input.purchase_type,
      eligibility_id: eligibility.eligibility_id,
    })

    return newApplication
  }

  async getByUserId(userId: string, filter: PropertyFilters) {
    return this.applicationRepository.getAllUserApplication(userId, filter)
  }

  async getById(id: string) {
    return this.applicationRepository.getApplicationById(id)
  }

  async requestOfferLetter(applicationId: string, userId: string) {
    const application = await this.getById(applicationId)

    if (!(application && application.user_id === userId)) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        application.status === ApplicationStatus.COMPLETED ? '' : '',
      )
    }

    if (application.offer_letter_id) {
      const offerLetter = await this.purchaseRepository.getOfferLetterById(
        application.offer_letter_id,
      )

      if (offerLetter) {
        throw new ApplicationCustomError(StatusCodes.FORBIDDEN, '')
      }
    }

    const property = await this.propertyRepository.getPropertyById(
      application.property_id,
    )

    if (!(property && property.is_sold)) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Sorry you can place a request for offer letter to this property',
      )
    }

    const offerLetter = await this.purchaseRepository.requestForOfferLetter({
      property_id: application.property_id,
      user_id: application.user_id,
      purchase_type: application.application_type,
      offer_letter_requested: true,
      offer_letter_status: OfferLetterStatus.Pending,
    })

    await this.applicationRepository.updateApplication({
      application_id: application.application_id,
      offer_letter_id: offerLetter.offer_letter_id,
    })

    return offerLetter
  }

  async getOfferLetterByApplicationId(applicationId: string, userId?: string) {
    if (userId) {
      const user = await this.userRepository.findById(userId)

      if (!user) {
        throw new ApplicationCustomError(
          StatusCodes.NOT_FOUND,
          'User not found',
        )
      }
    }

    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!application) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    if (!application.offer_letter_id) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'No offer letter associated with this application',
      )
    }

    const offerLetter = await this.purchaseRepository.getOfferLetterById(
      application.offer_letter_id,
    )

    if (!offerLetter) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'No offer letter associated with this application',
      )
    }

    return offerLetter
  }

  async requestPropertyClosing(applicationId: string, userId: string) {
    const application = await this.getById(applicationId)

    if (!(application && application.user_id === userId)) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        application.status === ApplicationStatus.COMPLETED ? '' : '',
      )
    }

    if (application.property_closing_id) {
      const propertyClosing =
        await this.purchaseRepository.getPropertyClosingById(
          application.property_closing_id,
        )

      if (propertyClosing) {
        throw new ApplicationCustomError(StatusCodes.FORBIDDEN, '')
      }
    }

    const property = await this.propertyRepository.getPropertyById(
      application.property_id,
    )

    if (!(property && property.is_sold)) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Sorry you can place a request for property closing to this property',
      )
    }
    const propertyClosing =
      await this.purchaseRepository.getPropertyClosingById(
        application.property_closing_id,
      )

    if (
      propertyClosing &&
      (propertyClosing.closing_status === PropertyClosingStatus.Approved ||
        propertyClosing.closing_status === PropertyClosingStatus.Pending)
    ) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'You have an ongoing property closing request',
      )
    }

    const propertyClsoing =
      await this.purchaseRepository.requestForPropertyClosing(
        application.application_id,
        userId,
      )

    await this.applicationRepository.updateApplication({
      application_id: applicationId,
      property_closing_id: propertyClosing.property_closing_id,
    })

    return propertyClsoing
  }

  async propertyClosingRespond(
    applicationId: string,
    input: RequestPropertyClosingInput,
  ) {
    const application = await this.getById(applicationId)

    if (!application) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        application.status === ApplicationStatus.COMPLETED ? '' : '',
      )
    }

    if (!application.property_closing_id) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You are yet to request for property closing on this application',
      )
    }

    const propertyClosing =
      await this.purchaseRepository.getPropertyClosingById(
        application.property_closing_id,
      )

    if (!propertyClosing) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You are yet to request for property closing on this application',
      )
    }

    const updatePropertyClosing =
      await this.purchaseRepository.updatePropertyClosing(
        application.property_closing_id,
        {
          closing_status: input.closing_status,
        },
      )

    if (
      input.closing_status === PropertyClosingStatus.Approved &&
      application.application_type === ApplicationPurchaseType.OUTRIGHT
    ) {
      const escrowStatus = await this.purchaseRepository.createEscrowStatus({
        property_id: application.property_id,
        user_id: application.user_id,
        escrow_status: EscrowMeetingStatus.AWAITING,
      })

      await this.applicationRepository.updateApplication({
        application_id: application.application_id,
        escrow_status_id: escrowStatus.escrow_status_id,
      })
    }

    return updatePropertyClosing
  }

  async requestOfferLetterRespond(
    applicationId: string,
    input: RequestOfferLetterRespondInput,
  ) {
    let offerLetter = await this.getOfferLetterByApplicationId(applicationId)

    if (
      offerLetter.offer_letter_status === input.offer_letter_status ||
      offerLetter.offer_letter_status !== OfferLetterStatus.Pending
    ) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        input.offer_letter_status === OfferLetterStatus.Approved ||
        offerLetter.offer_letter_status === OfferLetterStatus.Approved
          ? 'Offer letter approved already'
          : 'Offer letter rejected already',
      )
    }

    offerLetter = await this.purchaseRepository.updateOfferLetterStatus(
      offerLetter.offer_letter_id,
      { offer_letter_status: input.offer_letter_status },
    )

    return offerLetter
  }

  async scheduleEscrowMeeting(
    applicationId: string,
    userId: string,
    input: ScheduleEscrowMeetingInput,
  ) {
    const application = await this.getById(applicationId)

    if (!application) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        application.status === ApplicationStatus.COMPLETED ? '' : '',
      )
    }

    const property = await this.propertyRepository.getPropertyById(
      application.property_id,
    )

    if (!property) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Property not found',
      )
    }

    const escrowAttendance = await this.purchaseRepository.setEscrowAttendance({
      date: new Date(input.date),
      time: input.time,
      property_buyer_id: userId,
      property_name: property.property_name,
      property_id: property.id,
      agent_id: property.user_id,
      location: input.location,
      attendancees: input.attendees.join(','),
      property_types: application.application_type,
    })

    // this.purchaseRepository.confirmPropertyEscrowMeeting(escrowId, status)

    await this.applicationRepository.updateApplication({
      application_id: application.application_id,
      escrow_information_id: escrowAttendance.escrow_id,
    })

    return escrowAttendance
  }

  async scheduleEscrowMeetingRespond(
    applicationId: string,
    userId: string,
    input: ScheduleEscrowMeetingRespondInput,
  ) {
    const application = await this.getById(applicationId)

    if (!application) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        application.status === ApplicationStatus.COMPLETED ? '' : '',
      )
    }

    const property = await this.propertyRepository.getPropertyById(
      application.property_id,
    )

    if (!property) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Property not found',
      )
    }

    const escrowStatusInfo = (
      application as {
        escrow_status_info?: {
          escrow_status: EscrowInformationStatus | null
          escrow_meeting_info?: EscrowInformation | null
        }
      }
    ).escrow_status_info

    if (!(application.escrow_status_id || escrowStatusInfo)) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Escrow meeting process yet to be initiated',
      )
    }

    if (
      escrowStatusInfo.escrow_status.escrow_status ===
      EscrowMeetingStatus.AWAITING
    ) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You are not allowed to perform this action',
      )
    }

    if (!escrowStatusInfo.escrow_meeting_info) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Escrow meeting process yet to be setup',
      )
    }

    return this.purchaseRepository.confirmPropertyEscrowMeeting(
      application.escrow_status_id,
      input.confirm_attendance
        ? EscrowMeetingStatus.CONFIRMED
        : EscrowMeetingStatus.DECLINED,
    )
  }
}
