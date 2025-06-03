import { DocumentGroupKind } from '@domain/enums/documentEnum'
import { OrganizationType } from '@domain/enums/organizationEnum'

import {
  ApplicationPurchaseType,
  ApplicationStatus,
  EscrowMeetingStatus,
  OfferLetterStatus,
  PropertyClosingStatus,
} from '@domain/enums/propertyEnum'
import { UserStatus } from '@domain/enums/userEum'
import { getDeveloperClientView } from '@entities/Developer'
import { PrequalificationInput } from '@entities/PrequalificationInput'
import { Eligibility } from '@entities/prequalify/prequalify'
import { EscrowInformationStatus } from '@entities/PropertyPurchase'
import { EscrowInformation } from '@entities/PurchasePayment'
import {
  ReviewRequestApproval,
  ReviewRequestApprovalStatus,
  ReviewRequestStageKind,
  ReviewRequestStatus,
  ReviewRequestType,
  ReviewRequestTypeKind,
} from '@entities/Request'
import { getUserClientView } from '@entities/User'
import { IDeveloperRepository } from '@interfaces/IDeveloperRespository'
import { IDocumentRepository } from '@interfaces/IDocumentRepository'
import { IOfferLetterRepository } from '@interfaces/IOfferLetterRepository'
import { IOrganizationRepository } from '@interfaces/IOrganizationRepository'
import { IReviewRequestRepository } from '@interfaces/IReviewRequestRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { PrequalifyRepository } from '@repositories/prequalify/prequalifyRepository'
import { ApplicationRepository } from '@repositories/property/ApplicationRespository'
import { PropertyPurchaseRepository } from '@repositories/property/PropertyPurchaseRepository'
import { PropertyRepository } from '@repositories/property/PropertyRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { Role } from '@routes/index.t'
import { AuthInfo } from '@shared/utils/permission-policy'
import {
  ApplicationDocFilters,
  ApplicationDocUploadsInput,
  ApplicationFilters,
  CreateApplicationInput,
  OfferLetterFilters,
  RequestOfferLetterRespondInput,
  RequestPropertyClosingInput,
  ScheduleEscrowMeetingInput,
  ScheduleEscrowMeetingRespondInput,
} from '@validators/applicationValidator'
import { PropertyFilters } from '@validators/propertyValidator'
import { StatusCodes } from 'http-status-codes'

export class ApplicationService {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly propertyRepository: PropertyRepository,
    private readonly prequalifyRepository: PrequalifyRepository,
    private readonly purchaseRepository: PropertyPurchaseRepository,
    private readonly userRepository: UserRepository,
    private readonly OfferRepository: IOfferLetterRepository,
    private readonly reviewRequestRepository: IReviewRequestRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly documentRepository: IDocumentRepository,
    private readonly developerRepository: IDeveloperRepository,
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

    let preQualifier: PrequalificationInput | null = null
    let eligibility: Eligibility | null = null

    if (input.purchase_type !== ApplicationPurchaseType.OUTRIGHT) {
      preQualifier = await this.prequalifyRepository.getPreQualifyRequestByUser(
        userId,
        { property_id: input.property_id },
      )

      if (!preQualifier) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'You are required to complete your prequalification form before any application to either installment or mortagage',
        )
      }

      eligibility = await this.prequalifyRepository.findEligiblity(
        input.property_id,
        userId,
      )

      if (!eligibility) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'You are required to complete your prequalification form before any application to either installment or mortagage',
        )
      }
    }

    const newApplication = await this.applicationRepository.createApplication({
      user_id: userId,
      status: ApplicationStatus.PENDING,
      property_id: property.id,
      prequalifier_id: preQualifier?.id ?? null,
      application_type: input.purchase_type,
      eligibility_id: eligibility?.eligibility_id ?? null,
      developer_organization_id: property.organization_id,
    })

    if (input.purchase_type === ApplicationPurchaseType.INSTALLMENT) {
      await this.prequalifyRepository.storePaymentCalculator({
        application_id: newApplication.application_id,
        interest_rate: input.payment_calculator.interest_rate,
        repayment_type: input.payment_calculator.repayment_type,
        terms: input.payment_calculator.terms,
      })
    }

    return newApplication
  }

  async getByUserId(userId: string, filter: ApplicationFilters) {
    return this.applicationRepository.getAllApplication({
      ...filter,
      user_id: userId,
    })
  }

  async getAllPropertyClosingsByHSF(filter: PropertyFilters) {
    const propertyClosings =
      await this.purchaseRepository.findAllPropertyClosings(filter)

    propertyClosings.result = await Promise.all(
      propertyClosings.result.map(async (closing) => {
        const property = await this.propertyRepository.getPropertyById(
          closing.property_id,
        )

        const applications = await this.applicationRepository.getAllApplication(
          {
            user_id: closing.user_id,
            organization_id: property.organization_id,
            result_per_page: Number.MAX_SAFE_INTEGER,
          },
        )

        const application = applications.result.find(
          (application) =>
            application.property_closing_id === closing.property_closing_id,
        )

        const developer = await this.developerRepository.getDeveloperByOrgId(
          property.organization_id,
        )

        const requestedBy = await this.userRepository.findById(closing.user_id)

        return {
          ...closing,
          application_id: application?.application_id ?? null,
          property: {
            ...property,
            developer: getDeveloperClientView(developer),
          },
          ...(requestedBy && { requested_by: getUserClientView(requestedBy) }),
        }
      }),
    )

    return propertyClosings
  }

  async getById(id: string, authInfo: AuthInfo) {
    const application = await this.applicationRepository.getApplicationById(id)

    if (
      authInfo.globalRole === Role.HOME_BUYER &&
      application.user_id !== authInfo.userId
    ) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    if (
      authInfo.organizationType === OrganizationType.DEVELOPER_COMPANY &&
      application.developer_organization_id !== authInfo.currentOrganizationId
    ) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    return application
  }

  async getByDeveloperOrg(organizationId: string, filter: ApplicationFilters) {
    return this.applicationRepository.getAllApplication({
      ...filter,
      organization_id: organizationId,
    })
  }

  async getByHSF(filter: ApplicationFilters) {
    return this.applicationRepository.getAllApplication({
      ...filter,
    })
  }

  async getAll(filter: ApplicationFilters) {
    return this.applicationRepository.getAllApplication({
      ...filter,
    })
  }

  async requestOfferLetter(applicationId: string, userId: string) {
    const [user, application] = await Promise.all([
      this.userRepository.findById(userId),
      this.applicationRepository.getApplicationById(applicationId),
    ])

    if (!(application && user && application.user_id === userId)) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        application.status === ApplicationStatus.COMPLETED
          ? 'Application is already completed'
          : `Application status is ${application.status}, cannot request property closing`,
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

    if (!property || property.is_sold) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Sorry you can place a request for offer letter to this property',
      )
    }

    const outrightReviewType =
      await this.reviewRequestRepository.getReviewRequestTypeByKind(
        ReviewRequestTypeKind.OfferLetterOutright,
      )

    if (!outrightReviewType) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Sorry! We are unable to place your request',
      )
    }

    let outrightReviewTypeStage =
      await this.reviewRequestRepository.getReviewRequestTypeStagesByRequestTypeID(
        outrightReviewType.id,
      )

    if (!outrightReviewTypeStage.length) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Sorry! We are unable to place your request',
      )
    }

    const reviewRequest =
      await this.reviewRequestRepository.createReviewRequest({
        initiator_id: application.user_id,
        status: ReviewRequestStatus.Pending,
        request_type_id: outrightReviewType.id,
        submission_date: new Date(),
        candidate_name: `${user.first_name} ${user.last_name}`,
      })

    await this.reviewRequestRepository.createReviewRequestApproval({
      request_id: reviewRequest.id,
      review_request_stage_type_id: outrightReviewTypeStage[0].id,
      approval_status: ReviewRequestApprovalStatus.Pending,
      organization_id: application.developer_organization_id,
    })

    const offerLetter = await this.purchaseRepository.requestForOfferLetter({
      property_id: application.property_id,
      user_id: application.user_id,
      purchase_type: application.application_type,
      offer_letter_requested: true,
      offer_letter_status: OfferLetterStatus.Pending,
      review_request_id: reviewRequest.id,
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
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!(application && application.user_id === userId)) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        application.status === ApplicationStatus.COMPLETED
          ? 'Application is already completed'
          : `Application status is ${application.status}, cannot respond to property closing request`,
      )
    }

    if (application.property_closing_id) {
      const propertyClosing =
        await this.purchaseRepository.getPropertyClosingById(
          application.property_closing_id,
        )

      if (propertyClosing) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'Property closing request already initiated for this application',
        )
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
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!application) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        application.status === ApplicationStatus.COMPLETED
          ? 'Application is already completed'
          : `Application status is ${application.status}, cannot respond to property closing request`,
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
    organizationId: string,
    userId: string,
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

    const approval =
      await this.reviewRequestRepository.getReviewRequestApprovalById(
        input.approval_id,
      )

    const currentUser = await this.userRepository.findById(userId)

    if (
      !(
        approval &&
        approval.organization_id === organizationId &&
        approval.approval_status === ReviewRequestApprovalStatus.Pending
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You are not allowed to perform this action',
      )
    }

    if (approval.approval_id) {
      const approver = await this.userRepository.findById(approval.approval_id)

      if (approver && approver.id !== approval.approval_id) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'You are not allowed to perform this action',
        )
      }
    } else if (
      ![Role.HSF_ADMIN, Role.LENDER_ADMIN, Role.DEVELOPER_ADMIN].includes(
        currentUser.role,
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You are not allowed to perform this action',
      )
    }

    await this.reviewRequestRepository.updateReviewRequestApproval(
      approval.id,
      {
        approval_date: new Date(),
        approval_status:
          input.offer_letter_status === OfferLetterStatus.Approved
            ? ReviewRequestApprovalStatus.Approved
            : ReviewRequestApprovalStatus.Rejected,

        approval_id: userId,
      },
    )

    const requestTypeStage =
      await this.reviewRequestRepository.getReviewRequestTypeStageByID(
        approval.review_request_stage_type_id,
      )

    const requestTypeStageList =
      await this.reviewRequestRepository.getReviewRequestTypeStagesByRequestTypeID(
        requestTypeStage.request_type_id,
      )

    const lastTypeStage = requestTypeStageList.at(-1)
    if (lastTypeStage.id === approval.review_request_stage_type_id) {
      await this.reviewRequestRepository.updateReviewRequest(
        approval.request_id,
        {
          status:
            input.offer_letter_status === OfferLetterStatus.Approved
              ? ReviewRequestStatus.Approved
              : ReviewRequestStatus.Rejected,
        },
      )
      await this.purchaseRepository.updateOfferLetterStatus(
        offerLetter.offer_letter_id,
        { offer_letter_status: input.offer_letter_status },
      )
    }

    return offerLetter
  }

  async scheduleEscrowMeeting(
    applicationId: string,
    authInfo: AuthInfo,
    input: ScheduleEscrowMeetingInput,
  ) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!application) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        `Application is not in a PENDING state. Current status: ${application.status}`,
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

    const applicantUser = await this.userRepository.findById(
      application.user_id,
    )

    if (!(applicantUser && applicantUser.status === UserStatus.Active)) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Applicant user not active',
      )
    }

    const members = await this.organizationRepository.getOrganizationMembers(
      authInfo.currentOrganizationId,
      {
        page_number: 1,
        result_per_page: Number.MAX_SAFE_INTEGER,
      },
    )

    const notMember = input.attendees.find(
      (attendeeId) =>
        !members.result.find((member) => member.user_id === attendeeId),
    )

    if (notMember) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        `We found the user with id '${notMember} not an HSF member'`,
      )
    }

    const escrowMeetingRequestType =
      await this.reviewRequestRepository.getReviewRequestTypeByKind(
        ReviewRequestTypeKind.EscrowMeetingRequest,
      )

    if (!escrowMeetingRequestType) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Sorry! We are unable to place your request',
      )
    }

    let escrowMeetingRequestStage =
      await this.reviewRequestRepository.getReviewRequestTypeStagesByRequestTypeID(
        escrowMeetingRequestType.id,
      )

    if (!escrowMeetingRequestStage.length) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Sorry! We are unable to place your request',
      )
    }

    escrowMeetingRequestStage = escrowMeetingRequestStage.sort(
      (stageA, stageB) => (stageA.stage_order > stageB.stage_order ? 1 : -1),
    )

    const reviewRequest =
      await this.reviewRequestRepository.createReviewRequest({
        candidate_name: `${applicantUser.first_name} ${applicantUser.last_name}`,
        initiator_id: application.user_id,
        request_type_id: escrowMeetingRequestType.id,
        submission_date: new Date(),
        status: ReviewRequestStatus.Pending,
      })

    const firstRequestTypeStage = escrowMeetingRequestStage[0]

    const firstStage =
      await this.reviewRequestRepository.getReviewRequestStageByID(
        firstRequestTypeStage.stage_id,
      )

    let organizationId = application.developer_organization_id

    if (firstStage.organization_type === OrganizationType.HSF_INTERNAL) {
      organizationId = authInfo.currentOrganizationId
    } else if (
      firstStage.organization_type === OrganizationType.DEVELOPER_COMPANY
    ) {
      organizationId = application.developer_organization_id
    }

    await this.reviewRequestRepository.createReviewRequestApproval({
      request_id: reviewRequest.id,
      review_request_stage_type_id: firstRequestTypeStage.id,
      approval_status: ReviewRequestApprovalStatus.Pending,
      organization_id: organizationId,
    })

    const escrowAttendance = await this.purchaseRepository.setEscrowAttendance(
      {
        date: new Date(input.date),
        time: input.time,
        property_buyer_id: application.user_id,
        property_name: property.property_name,
        property_id: property.id,
        location: input.location,
        property_types: application.application_type,
        review_request_id: reviewRequest.id,
        application_id: application.application_id,
        organization_id: application.developer_organization_id,
      },
      input.attendees,
    )

    await this.applicationRepository.updateApplication({
      application_id: application.application_id,
      escrow_information_id: escrowAttendance.escrow_id,
    })

    await this.purchaseRepository.updateEscrowStatus(
      application.application_id,
      { escrow_information_id: escrowAttendance.escrow_id },
    )

    return escrowAttendance
  }

  async scheduleEscrowMeetingRespond(
    applicationId: string,
    authInfo: AuthInfo,
    input: ScheduleEscrowMeetingRespondInput,
  ) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

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

    if (
      !application.escrow_status_id &&
      (!escrowStatusInfo || !escrowStatusInfo.escrow_meeting_info)
    ) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Escrow meeting process yet to be initiated or required information is missing',
      )
    }

    const approval =
      await this.reviewRequestRepository.getReviewRequestApprovalById(
        input.approval_id,
      )

    if (!approval) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Invalid approval request access',
      )
    }

    if (approval.approval_status !== ReviewRequestApprovalStatus.Pending) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        `Approval request is not in a PENDING state. Current status: ${approval.approval_status}`,
      )
    }

    const approvals =
      await this.reviewRequestRepository.getReviewRequestApprovalByRequestID(
        approval.request_id,
      )

    const allowRoleApprover = approvals
      .find((a) => a.id === approval.id)
      .request_approvers.find(
        (approver) => approver.role_id === authInfo.roleId,
      )

    if (!allowRoleApprover) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You are not allowed to approve this document',
      )
    }

    const updatedApproval =
      await this.reviewRequestRepository.updateReviewRequestApproval(
        approval.id,
        {
          approval_status: input.confirm_attendance
            ? ReviewRequestApprovalStatus.Approved
            : ReviewRequestApprovalStatus.Rejected,
        },
      )

    const currentReviewTypeStage =
      await this.reviewRequestRepository.getReviewRequestTypeStageByID(
        approval.review_request_stage_type_id,
      )

    const requestStageTypes =
      await this.reviewRequestRepository.getReviewRequestTypeStagesByRequestTypeID(
        currentReviewTypeStage.request_type_id,
      )

    const currentStageType = requestStageTypes.find(
      (type) => type.id === approval.review_request_stage_type_id,
    )

    const currentStage =
      await this.reviewRequestRepository.getReviewRequestStageByID(
        currentStageType.stage_id,
      )

    const nextStageType = requestStageTypes.find(
      (type) => type.stage_order > currentStageType.stage_order,
    )

    const nextStage =
      await this.reviewRequestRepository.getReviewRequestStageByID(
        nextStageType.stage_id,
      )

    if (
      currentStage.name ===
        ReviewRequestStageKind.DeveloperEscrowMeetingRespond &&
      updatedApproval.approval_status === ReviewRequestApprovalStatus.Approved
    ) {
      await this.purchaseRepository.updateEscrowStatus(
        application.escrow_status_id,
        {
          escrow_status: EscrowMeetingStatus.AWAITING_ACCEPTANCE,
        },
      )
    }

    if (requestStageTypes.at(-1).id === approval.review_request_stage_type_id) {
      await this.reviewRequestRepository.updateReviewRequest(
        approval.request_id,
        {
          status: input.confirm_attendance
            ? ReviewRequestStatus.Approved
            : ReviewRequestStatus.Rejected,
        },
      )

      await this.purchaseRepository.confirmPropertyEscrowMeeting(
        application.escrow_status_id,
        input.confirm_attendance
          ? EscrowMeetingStatus.CONFIRMED
          : EscrowMeetingStatus.DECLINED,
      )
      return updatedApproval
    }

    let organizationId: string | null = null
    let approverId: string | null = null
    if (
      nextStage.name === ReviewRequestStageKind.HomeBuyerEscrowMeetingRespond
    ) {
      approverId = application.user_id
    } else if (
      nextStage.name === ReviewRequestStageKind.DeveloperEscrowMeetingRespond
    ) {
      organizationId = application.developer_organization_id
    }

    await this.reviewRequestRepository.createReviewRequestApproval({
      request_id: approval.request_id,
      review_request_stage_type_id: nextStageType.id,
      approval_status: ReviewRequestApprovalStatus.Pending,
      organization_id: organizationId,
      approval_id: approverId,
    })

    return updatedApproval
  }

  async getOfferLetters(authInfo: AuthInfo, filters: OfferLetterFilters) {
    // if (authInfo.organizationType !== OrganizationType.HSF_INTERNAL) {
    filters.organization_id = authInfo.currentOrganizationId

    if (
      ![Role.DEVELOPER_ADMIN, Role.LENDER_ADMIN].includes(authInfo.globalRole)
    ) {
      filters.approver_id = authInfo.userId
    }
    // }

    let reviewTypeKinds = await Promise.all(
      [ReviewRequestTypeKind.OfferLetterOutright].map((kind) =>
        this.reviewRequestRepository.getReviewRequestTypeByKind(kind),
      ),
    )

    reviewTypeKinds = await Promise.all(
      reviewTypeKinds.map(async (type) => {
        const stageTypes =
          await this.reviewRequestRepository.getReviewRequestTypeStagesByRequestTypeID(
            type.id,
          )

        const stages = await Promise.all(
          stageTypes.map((stageType) =>
            this.reviewRequestRepository.getReviewRequestStageByID(
              stageType.stage_id,
            ),
          ),
        )

        return stages.find(
          (stage) => stage.organization_type === authInfo.organizationType,
        )
          ? type
          : null
      }),
    )

    reviewTypeKinds = reviewTypeKinds.filter(
      (typeKind): typeKind is ReviewRequestType => !!typeKind,
    )

    const reviewRequestContent = await (authInfo.organizationType ===
    OrganizationType.HSF_INTERNAL
      ? this.reviewRequestRepository.getHsfReviewRequests(
          authInfo.currentOrganizationId,
          {
            ...filters,
            request_stage_type_ids: reviewTypeKinds.map((type) => type.id),
          },
        )
      : this.reviewRequestRepository.getOrgReviewRequests({ ...filters }))

    reviewRequestContent.result = await Promise.all(
      reviewRequestContent.result.map(async (request) => {
        const offerLetter = await this.OfferRepository.getByRequestId(
          request.id,
        )

        if (!offerLetter) return undefined

        const applicationContents =
          await this.applicationRepository.getAllApplication({
            offer_letter_id: offerLetter.offer_letter_id,
          })

        if (!applicationContents.result[0]) return undefined
        return {
          ...request,
          offer_letter: offerLetter,
          application: applicationContents.result[0],
        }
      }),
    )

    reviewRequestContent.result = reviewRequestContent.result.filter(
      (item) => !!item,
    )

    reviewRequestContent.total_records = reviewRequestContent.result.length

    return reviewRequestContent
  }

  async getRequiredDoc(
    applicationId: string,
    filters: ApplicationDocFilters,
    authInfo: AuthInfo,
  ) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!application) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    let requiredDocumentGroupTag: Array<DocumentGroupKind> = []

    if (!filters.group) {
      requiredDocumentGroupTag.push(
        DocumentGroupKind.MortgageUpload,
        DocumentGroupKind.ConditionPrecedent,
      )
    } else {
      requiredDocumentGroupTag.push(filters.group)
    }

    const documentTypes = await Promise.all(
      requiredDocumentGroupTag.map(async (kind) => {
        const documentGroup =
          await this.documentRepository.findDocumentGroupByTag(kind)
        if (!documentGroup) return []

        const groupDocumentTypes =
          await this.documentRepository.findGroupDocumentTypesByGroupId(
            documentGroup.id,
          )

        return Promise.all(
          groupDocumentTypes.map(async (gdt) => {
            const documentEntries = await this.documentRepository
              .findApplicationDocumentEntriesByApplicationIdAndGroupTypeId(
                applicationId,
                gdt.id,
              )
              .then(async (docEntries) => {
                return Promise.all(
                  docEntries.map(async (entry) => {
                    const reviewRequests =
                      await this.reviewRequestRepository.getReviewRequestApprovalByRequestID(
                        entry.review_request_id,
                      )

                    return {
                      ...entry,
                      review_requests: reviewRequests,
                    }
                  }),
                )
              })

            return {
              ...gdt,
              documents: documentEntries,
            }
          }),
        )
      }),
    )

    return documentTypes.flat(1)
  }

  async getFilledDocs(
    applicationId: string,
    filters: ApplicationDocFilters,
    authInfo: AuthInfo,
  ) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (
      !(
        application &&
        (authInfo.globalRole !== Role.HOME_BUYER ||
          application.user_id === authInfo.userId)
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    const documentGroup = await this.documentRepository.findDocumentGroupByTag(
      filters.group!,
    )

    if (!documentGroup) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Document group not found',
      )
    }

    const documentApplicationEntries =
      await this.documentRepository.findApplicationDocumentEntriesByApplicationId(
        application.application_id,
      )

    return Promise.all(
      documentApplicationEntries.map(async (entry) => {
        const documentType =
          await this.documentRepository.findGroupDocumentTypeById(
            entry.document_group_type_id,
          )
        const reviewRequest =
          await this.reviewRequestRepository.getReviewRequestID(
            entry.review_request_id,
          )
        let reviewRequestApprovals: Array<ReviewRequestApproval> = []

        if (reviewRequest) {
          reviewRequestApprovals =
            await this.reviewRequestRepository.getReviewRequestApprovalByRequestID(
              reviewRequest.id,
            )
        }

        return {
          ...entry,
          document_type: documentType,
          review_request: reviewRequest,
          review_request_approvals: reviewRequestApprovals,
        }
      }),
    )
  }

  async getEscrowMeetingStatus(applicationId: string, authInfo: AuthInfo) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (
      !(
        application &&
        ((authInfo.globalRole === Role.HOME_BUYER &&
          application.user_id === authInfo.userId) ||
          authInfo.organizationType === OrganizationType.HSF_INTERNAL ||
          (authInfo.organizationType === OrganizationType.DEVELOPER_COMPANY &&
            application.developer_organization_id ===
              authInfo.currentOrganizationId))
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    const escrowStatus = (
      application as {
        escrow_status_info?: { escrow_status?: EscrowInformationStatus }
      }
    )?.escrow_status_info?.escrow_status

    if (!escrowStatus) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Escrow meetting yet to be initiated',
      )
    }

    if (!application.escrow_information_id) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'No escrow meeting set',
      )
    }

    const escrowMeeting = await this.purchaseRepository.getEscrowInfo(
      application.escrow_information_id,
    )

    if (!escrowMeeting) {
      await this.applicationRepository.updateApplication({
        application_id: application.application_id,
        escrow_information_id: null,
      })

      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'No escrow meeting set',
      )
    }

    const approvals =
      await this.reviewRequestRepository.getReviewRequestApprovalByRequestID(
        escrowMeeting.review_request_id,
      )

    return {
      escrow_meeting: escrowMeeting,
      escrow_status: escrowStatus,
      approvals,
    }
  }

  async handleApplicationDocUploads(
    applicationId: string,
    input: ApplicationDocUploadsInput,
    authInfo: AuthInfo,
  ) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!application) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        `Application with ID '${applicationId}' not found.`,
      )
    }

    const user = await this.userRepository.findById(authInfo.userId)

    // Use a more descriptive name
    let allowedDocumentGroups: DocumentGroupKind[] = []

    if (application.application_type === ApplicationPurchaseType.MORTGAGE) {
      allowedDocumentGroups.push(
        DocumentGroupKind.MortgageUpload,
        DocumentGroupKind.ConditionPrecedent,
      )
    }

    if (allowedDocumentGroups.length === 0) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        `Application type '${application.application_type}' does not support document uploads.`,
      )
    }

    if (!allowedDocumentGroups.includes(input.group)) {
      throw new ApplicationCustomError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        `Document group '${input.group}' is not allowed for application type '${application.application_type}'. Allowed groups are: ${allowedDocumentGroups.join(
          ', ',
        )}`,
      )
    }

    const documentGroup = await this.documentRepository.findDocumentGroupByTag(
      input.group,
    )

    if (!documentGroup) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Document group with tag '${input.group}' is not properly set up.`,
      )
    }

    const documentGroupTypes =
      await this.documentRepository.findGroupDocumentTypesByGroupId(
        documentGroup.id,
      )

    if (!documentGroupTypes.length) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `No document types are set up for document group '${documentGroup.name}'.`,
      )
    }

    // Use a more descriptive name
    const missingDocumentType = documentGroupTypes.find((docType) =>
      input.documents.every((doc) => doc.id !== docType.id),
    )

    if (missingDocumentType) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        `Missing document type: '${missingDocumentType.document_type}'. Please ensure all required documents are uploaded.`,
      )
    }

    const hsfOrg = await this.organizationRepository.getHsfOrganization()

    console.log({ hsfOrg })

    const reviewRequestType =
      await this.reviewRequestRepository.getReviewRequestTypeByKind(
        ReviewRequestTypeKind.DipDocumentReview,
      )

    if (!reviewRequestType) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Review request type '${ReviewRequestTypeKind.DipDocumentReview}' not found.`,
      )
    }

    console.log({ reviewRequestType })

    const requestTypeStages =
      await this.reviewRequestRepository.getReviewRequestTypeStagesByRequestTypeID(
        reviewRequestType.id,
      )

    if (!requestTypeStages.length) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `No stages found for review request type '${reviewRequestType.type}'.`,
      )
    }

    const reviewStages = await Promise.all(
      requestTypeStages.map((requestTypeStage) =>
        this.reviewRequestRepository.getReviewRequestStageByID(
          requestTypeStage.stage_id,
        ),
      ),
    )

    const hsfReviewStage = reviewStages.find(
      (stage) => stage.organization_type === OrganizationType.HSF_INTERNAL,
    )

    if (!hsfReviewStage) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `HSF Internal review stage not found.`,
      )
    }

    const hsfRequestTypeStage = requestTypeStages.find(
      ({ stage_id }) => hsfReviewStage.id === stage_id,
    )

    if (!hsfRequestTypeStage) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `HSF Request Type Stage not found.`,
      )
    }

    return Promise.all(
      input.documents.map(async (doc) => {
        const reviewRequest =
          await this.reviewRequestRepository.createReviewRequest({
            candidate_name: `${user.first_name} ${user.last_name}`,
            initiator_id: user.id,
            status: ReviewRequestStatus.Pending,
            submission_date: new Date(),
            request_type_id: reviewRequestType.id,
          })

        const reviewRequestApproval =
          await this.reviewRequestRepository.createReviewRequestApproval({
            organization_id: hsfOrg.id,
            request_id: reviewRequest.id,
            review_request_stage_type_id: hsfRequestTypeStage.id,
            approval_status: ReviewRequestApprovalStatus.Pending,
          })

        const applicationDocument =
          await this.documentRepository.createApplicationDocumentEntry({
            review_request_id: reviewRequest.id,
            application_id: application.application_id,
            document_group_type_id: doc.id,
            document_name: doc.file_name,
            document_size: String(doc.file_size),
            document_url: doc.file_url,
          })

        return {
          review_request: reviewRequest,
          review_approval: reviewRequestApproval,
          application_document: applicationDocument,
        }
      }),
    )
  }
}
