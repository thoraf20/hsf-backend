import { DocumentGroupKind } from '@domain/enums/documentEnum'
import { OrganizationType } from '@domain/enums/organizationEnum'
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
import { UserStatus } from '@domain/enums/userEum'
import {
  Eligibility,
  payment_calculator,
  preQualify,
} from '@entities/prequalify/prequalify'
import { EscrowInformationStatus } from '@entities/PropertyPurchase'
import { EscrowInformation } from '@entities/PurchasePayment'
import {
  ReviewRequestApprovalStatus,
  ReviewRequestStatus,
  ReviewRequestType,
  ReviewRequestTypeKind,
} from '@entities/Request'
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
      input.purchase_type === ApplicationPurchaseType.INSTALLMENT ||
      input.purchase_type === ApplicationPurchaseType.MORTGAGE
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
    }

    const newApplication = await this.applicationRepository.createApplication({
      user_id: userId,
      status: ApplicationStatus.PENDING,
      property_id: property.id,
      prequalifier_id: preQualifier?.status_id ?? null,
      application_type: input.purchase_type,
      eligibility_id: eligibility?.eligibility_id ?? null,
      developer_organization_id: property.organization_id,
    })

    return newApplication
  }

  async getByUserId(userId: string, filter: PropertyFilters) {
    return this.applicationRepository.getAllApplication({
      ...filter,
      user_id: userId,
    })
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

  async getByDeveloperOrg(organizationId: string, filter: PropertyFilters) {
    return this.applicationRepository.getAllApplication({
      ...filter,
      organization_id: organizationId,
    })
  }

  async getByHSF(filter: PropertyFilters) {
    return this.applicationRepository.getAllApplication({
      ...filter,
    })
  }

  async getAll(filter: PropertyFilters) {
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
      await this.reviewRequestRepository.getReviewRequestApprovalByOrgRequestID(
        input.request_id,
        organizationId,
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
    userId: string,
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

    const applicantUser = await this.userRepository.findById(
      application.user_id,
    )

    if (!(applicantUser && applicantUser.status === UserStatus.Active)) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Applicant user not active',
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
      const org = await this.organizationRepository.getHsfOrganization()

      if (!org) {
        throw new ApplicationCustomError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'Sorry! We are unable to place your request',
        )
      }

      organizationId = org.id
    }

    await this.reviewRequestRepository.createReviewRequestApproval({
      request_id: reviewRequest.id,
      review_request_stage_type_id: firstRequestTypeStage.id,
      approval_status: ReviewRequestApprovalStatus.Pending,
      organization_id: organizationId,
    })

    const escrowAttendance = await this.purchaseRepository.setEscrowAttendance({
      date: new Date(input.date),
      time: input.time,
      property_buyer_id: userId,
      property_name: property.property_name,
      property_id: property.id,
      agent_id: property.organization_id,
      location: input.location,
      attendancees: input.attendees.join(','),
      property_types: application.application_type,
      review_request_id: reviewRequest.id,
      application_id: application.application_id,
    })

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

  async getOfferLetters(authInfo: AuthInfo, filters: OfferLetterFilters) {
    if (authInfo.organizationType !== OrganizationType.HSF_INTERNAL) {
      filters.organization_id = authInfo.currentOrganizationId

      if (
        ![Role.DEVELOPER_ADMIN, Role.LENDER_ADMIN].includes(authInfo.globalRole)
      ) {
        filters.approver_id = authInfo.userId
      }
    }

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

  async getRequiredDoc(applicationId: string, authInfo: AuthInfo) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!application) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    let requiredDocumentGroupTag: Array<DocumentGroupKind> = []

    // if (application.application_type === ApplicationPurchaseType.MORTGAGE) {
    requiredDocumentGroupTag.push(
      DocumentGroupKind.MortgageUpload,
      DocumentGroupKind.ConditionPrecedent,
    )
    // }

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
}
