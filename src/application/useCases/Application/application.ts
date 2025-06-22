import { DocumentGroupKind } from '@domain/enums/documentEnum'
import {
  LoanAgreementStatus,
  LoanDecisionStatus,
  LoanOfferWorkflowStatus,
} from '@domain/enums/loanEnum'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { EligibilityStatus } from '@domain/enums/prequalifyEnum'

import {
  ApplicationPurchaseType,
  ApplicationStatus,
  ConditionPrecedentDocumentStatus,
  ConditionPrecedentStatus,
  DipDocumentReviewStatus,
  DIPStatus,
  EscrowMeetingStatus,
  LoanOfferStatus,
  LoanRepaymentFrequency,
  OfferLetterStatus,
  PropertyClosingStatus,
} from '@domain/enums/propertyEnum'
import { ADMIN_LEVEL_ROLES } from '@domain/enums/rolesEmun'
import {
  AssignableType,
  UserAssignmentRole,
  UserStatus,
} from '@domain/enums/userEum'
import {
  ApplicationStage,
  InstallmentApplicationStage,
  MortgageApplicationStage,
  OutrightApplicationStage,
} from '@entities/Application'
import { ConditionPrecedent } from '@entities/ConditionPrecedent'
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
import { runWithTransaction } from '@infrastructure/database/knex'
import { IConditionPrecedentRepository } from '@interfaces/IConditionPrecedentRepository'
import { IDeveloperRepository } from '@interfaces/IDeveloperRespository'
import { IDocumentRepository } from '@interfaces/IDocumentRepository'
import { ILenderRepository } from '@interfaces/ILenderRepository'
import { ILoanDecisionRepository } from '@interfaces/ILoanDecisionRepository'
import { ILoanOfferRepository } from '@interfaces/ILoanOfferRepository'
import { ILoanRepaymentScheduleRepository } from '@interfaces/ILoanRepaymentScheduleRepository'
import { ILoanRepaymentTransactionRepository } from '@interfaces/ILoanRepaymentTransactionRepository'
import { ILoanRepository } from '@interfaces/ILoanRepository'
import { IMortageRespository } from '@interfaces/IMortageRespository'
import { IOfferLetterRepository } from '@interfaces/IOfferLetterRepository'
import { IOrganizationRepository } from '@interfaces/IOrganizationRepository'
import { IReviewRequestRepository } from '@interfaces/IReviewRequestRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { LoanAgreementRepository } from '@repositories/loans/LoanAgreementRepository'
import { PrequalifyRepository } from '@repositories/prequalify/prequalifyRepository'
import { ApplicationRepository } from '@repositories/property/ApplicationRespository'
import { PropertyPurchaseRepository } from '@repositories/property/PropertyPurchaseRepository'
import { PropertyRepository } from '@repositories/property/PropertyRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { Role } from '@routes/index.t'
import { getApplicationStages } from '@shared/utils/application-stages'
import { QueryBoolean } from '@shared/utils/helpers'
import { AuthInfo, canAccessApplication } from '@shared/utils/permission-policy'
import { createDate, TimeSpan } from '@shared/utils/time-unit'
import {
  ApplicationDocApprovalInput,
  ApplicationDocFilters,
  ApplicationDocUploadsInput,
  ApplicationFilters,
  CreateApplicationInput,
  CompleteApplicationDocReviewInput,
  OfferLetterFilters,
  RequestOfferLetterRespondInput,
  RequestPropertyClosingInput,
  ScheduleEscrowMeetingInput,
  ScheduleEscrowMeetingRespondInput,
  HomeBuyserLoanOfferRespondInput,
  SubmitSignedLoanOfferLetterInput,
  UploadLoanAgreementDocInput,
  SetApplicationLoanOfficerInput,
} from '@validators/applicationValidator'
import { PropertyFilters } from '@validators/propertyValidator'
import { StatusCodes } from 'http-status-codes'
import emailTemplete from '@infrastructure/email/template/constant'
import { UserAssignmentRepository } from '@repositories/user/UserAssignmentRepository'
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
    private readonly mortgageRepository: IMortageRespository,
    private readonly lenderRepository: ILenderRepository,
    private readonly loanOfferRepository: ILoanOfferRepository,
    private readonly loanDecisionRepository: ILoanDecisionRepository,
    private readonly conditionPrecedentRepository: IConditionPrecedentRepository,
    private readonly loanRepository: ILoanRepository,
    private readonly loanRepaymentScheduleRepository: ILoanRepaymentScheduleRepository,
    private readonly loanRepaymentTransactionRepository: ILoanRepaymentTransactionRepository,
    private readonly loanAgreementRepository: LoanAgreementRepository,
    private readonly userAssignmentRepository: UserAssignmentRepository,
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

    return runWithTransaction(async () => {
      const newApplication = await this.applicationRepository.createApplication(
        {
          user_id: userId,
          status: ApplicationStatus.PENDING,
          property_id: property.id,
          prequalifier_id: preQualifier?.id ?? null,
          application_type: input.purchase_type,
          eligibility_id: eligibility?.eligibility_id ?? null,
          developer_organization_id: property.organization_id,
        },
      )

      if (input.purchase_type === ApplicationPurchaseType.INSTALLMENT) {
        await this.prequalifyRepository.storePaymentCalculator({
          application_id: newApplication.application_id,
          interest_rate: input.payment_calculator.interest_rate,
          repayment_type: input.payment_calculator.repayment_type,
          terms: input.payment_calculator.terms,
        })
      }

      switch (input.purchase_type) {
        case ApplicationPurchaseType.INSTALLMENT:
          await Promise.all([
            this.applicationRepository.addApplicationStage(
              newApplication.application_id,
              {
                stage: InstallmentApplicationStage.PaymentCalculator,
                entry_time: new Date(),
                exit_time: new Date(),
                application_id: newApplication.application_id,
                user_id: newApplication.user_id,
              },
            ),
            this.applicationRepository.addApplicationStage(
              newApplication.application_id,
              {
                stage: InstallmentApplicationStage.PreQualification,
                entry_time: new Date(),
                application_id: newApplication.application_id,
                user_id: newApplication.user_id,
              },
            ),
          ])
          break
        case ApplicationPurchaseType.MORTGAGE:
          await this.applicationRepository.addApplicationStage(
            newApplication.application_id,
            {
              stage: MortgageApplicationStage.PreQualification,
              entry_time: new Date(),
              application_id: newApplication.application_id,
              user_id: newApplication.user_id,
            },
          )
          break
        case ApplicationPurchaseType.OUTRIGHT:
          await this.applicationRepository.addApplicationStage(
            newApplication.application_id,
            {
              stage: OutrightApplicationStage.OfferLetter,
              entry_time: new Date(),
              application_id: newApplication.application_id,
              user_id: newApplication.user_id,
            },
          )
          break
      }

      return newApplication
    })
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

  async getByLender(filter: ApplicationFilters, authInfo: AuthInfo) {
    const lenderProfile = await this.lenderRepository.getLenderByOrgId(
      authInfo.currentOrganizationId,
    )

    if (!lenderProfile) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Lender profile not found',
      )
    }

    return this.applicationRepository.getAllApplication({
      ...filter,
      lender_id: lenderProfile.id,
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
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'You have an active offer letter request',
        )
      }
    }

    const property = await this.propertyRepository.getPropertyById(
      application.property_id,
    )

    if (!property || property.is_sold) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Sorry you cannot place a request for offer letter to this property',
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

    if (!property) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Property not found',
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

    return runWithTransaction(async () => {
      const propertyClosing =
        await this.purchaseRepository.requestForPropertyClosing(
          application.property_id,
          userId,
        )

      await this.applicationRepository.updateApplication({
        application_id: applicationId,
        property_closing_id: propertyClosing.property_closing_id,
      })

      if (
        application.application_type === ApplicationPurchaseType.INSTALLMENT ||
        application.application_type === ApplicationPurchaseType.OUTRIGHT
      ) {
        await Promise.all(
          application.stages?.map(async (stage) => {
            if (stage.exit_time) return null

            await this.applicationRepository.updateApplicationStage(stage.id, {
              exit_time: new Date(),
            })
          }),
        )

        await this.applicationRepository.addApplicationStage(applicationId, {
          application_id: application.application_id,
          entry_time: new Date(),
          user_id: application.user_id,
          stage:
            application.application_type === ApplicationPurchaseType.INSTALLMENT
              ? InstallmentApplicationStage.PropertyClosing
              : OutrightApplicationStage.PropertyClosing,
        })
      }
      return propertyClosing
    })
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

    return runWithTransaction(async () => {
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

        await Promise.all(
          application.stages?.map(async (stage) => {
            if (stage.exit_time) return
            this.applicationRepository.updateApplicationStage(stage.id, {
              exit_time: new Date(),
            })
          }),
        )

        await this.applicationRepository.updateApplication({
          application_id: application.application_id,
          escrow_status_id: escrowStatus.escrow_status_id,
        })
      }

      return updatePropertyClosing
    })
  }

  async requestOfferLetterRespond(
    organizationId: string,
    userId: string,
    applicationId: string,
    input: RequestOfferLetterRespondInput,
  ) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!application) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

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

    return runWithTransaction(async () => {
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
    })
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

    // const members = await this.organizationRepository.getOrganizationMembers(
    //   authInfo.currentOrganizationId,
    //   {
    //     page_number: 1,
    //     result_per_page: Number.MAX_SAFE_INTEGER,
    //   },
    // )

    // const notMember = input.attendees.find(
    //   (attendeeId) =>
    //     !members.result.find((member) => member.user_id === attendeeId),
    // )

    // if (notMember) {
    //   throw new ApplicationCustomError(
    //     StatusCodes.FORBIDDEN,
    //     `We found the user with id '${notMember} not an HSF member'`,
    //   )
    // }

    const escrowMeetingRequestType =
      await this.reviewRequestRepository.getReviewRequestTypeByKind(
        ReviewRequestTypeKind.EscrowMeetingRequest,
      )

    console.log({ escrowMeetingRequestType })

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

    return runWithTransaction(async () => {
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

      const escrowAttendance =
        await this.purchaseRepository.setEscrowAttendance(
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
            agent_name: input.agent_name,
            agent_phone_number: input.agent_phone_number,
            meeting_details: input.meeting_details,
            organization_id: application.developer_organization_id,
            user_id: application.user_id,
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

      if (application.application_type === ApplicationPurchaseType.OUTRIGHT) {
        await this.applicationRepository.addApplicationStage(
          application.application_id,
          {
            application_id: application.application_id,
            stage: OutrightApplicationStage.EscrowMeeting,
            entry_time: new Date(),
            user_id: application.user_id,
          },
        )
      }

      return escrowAttendance
    })
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

    return runWithTransaction(async () => {
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

      if (
        requestStageTypes.at(-1).id === approval.review_request_stage_type_id
      ) {
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

      const nextStageType = requestStageTypes.find(
        (type) => type.stage_order > currentStageType.stage_order,
      )

      if (nextStageType) {
        const nextStage =
          await this.reviewRequestRepository.getReviewRequestStageByID(
            nextStageType.stage_id,
          )

        let organizationId: string | null = null
        let approverId: string | null = null
        if (
          nextStage.name ===
          ReviewRequestStageKind.HomeBuyerEscrowMeetingRespond
        ) {
          approverId = application.user_id
        } else if (
          nextStage.name ===
          ReviewRequestStageKind.DeveloperEscrowMeetingRespond
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
      }

      return updatedApproval
    })
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

        if (authInfo.organizationType !== OrganizationType.HSF_INTERNAL) {
          return stages.find(
            (stage) => stage.organization_type === authInfo.organizationType,
          )
            ? type
            : null
        }
        return type
      }),
    )

    reviewTypeKinds = reviewTypeKinds.filter(
      (typeKind): typeKind is ReviewRequestType => !!typeKind,
    )

    const reviewRequestContent =
      await this.reviewRequestRepository.getOrgReviewRequests({
        ...filters,
        request_stage_type_ids: reviewTypeKinds.map((type) => type.id),
      })

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

    if (filters.pending === QueryBoolean.YES) {
      return documentTypes.flat(1).filter((type) => type.documents.length === 0)
    }
    return documentTypes.flat(1)
  }

  async getApplicationDocGroups(applicationId: string, authInfo: AuthInfo) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!application) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    let requiredDocumentGroupTag: Array<DocumentGroupKind> = []

    if (application.application_type === ApplicationPurchaseType.MORTGAGE) {
      requiredDocumentGroupTag.push(
        DocumentGroupKind.MortgageUpload,
        DocumentGroupKind.ConditionPrecedent,
      )
    }

    return await Promise.all(
      requiredDocumentGroupTag.map(async (kind) => {
        const documentGroup =
          await this.documentRepository.findDocumentGroupByTag(kind)
        if (!documentGroup) return []

        const groupDocumentTypes =
          await this.documentRepository.findGroupDocumentTypesByGroupId(
            documentGroup.id,
          )

        return {
          ...documentGroup,
          document_types: groupDocumentTypes,
        }
      }),
    )
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

    let documentApplicationEntries =
      await this.documentRepository.findApplicationDocumentEntriesByApplicationId(
        application.application_id,
      )

    const documentContents = await Promise.all(
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

    return documentContents.filter(
      (doc) => doc.document_type.group_id === documentGroup.id,
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

    const missingDocumentType = documentGroupTypes.find((docType) =>
      input.documents.every((doc) => doc.document_group_type_id !== docType.id),
    )

    if (missingDocumentType) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        `Missing document type: '${missingDocumentType.document_type}'. Please ensure all required documents are uploaded.`,
      )
    }

    const hsfOrg = await this.organizationRepository.getHsfOrganization()

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

    return runWithTransaction(async () => {
      if (application.dip) {
        await this.mortgageRepository.updateDipById({
          dip_id: application.dip.dip_id,
          documents_status: DipDocumentReviewStatus.Reviewing,
          dip_status: DIPStatus.DocumentReviewing,
        })
      }

      const documentStage = application.stages?.find((stage) =>
        input.group === DocumentGroupKind.MortgageUpload
          ? stage.stage === MortgageApplicationStage.UploadDocument
          : stage.stage === MortgageApplicationStage.ConditionPrecedent,
      )

      if (!documentStage) {
        await Promise.all(
          application.stages?.map(async (stage) => {
            if (stage.exit_time) return null

            await this.applicationRepository.updateApplicationStage(stage.id, {
              exit_time: new Date(),
            })
          }),
        )

        await this.applicationRepository.addApplicationStage(
          application.application_id,
          {
            entry_time: new Date(),
            application_id: application.application_id,
            user_id: application.user_id,
            stage:
              input.group === DocumentGroupKind.MortgageUpload
                ? MortgageApplicationStage.UploadDocument
                : MortgageApplicationStage.ConditionPrecedent,
          },
        )
      }

      if (
        application.application_type === ApplicationPurchaseType.MORTGAGE &&
        input.group === DocumentGroupKind.ConditionPrecedent
      ) {
        let conditionPrecedent: ConditionPrecedent
        if (application.condition_precedent_id) {
          conditionPrecedent = await this.conditionPrecedentRepository.findById(
            application.condition_precedent_id,
          )
        }

        if (!conditionPrecedent) {
          conditionPrecedent = await this.conditionPrecedentRepository.create({
            application_id: application.application_id,
            status: ConditionPrecedentStatus.Pending,
            documents_status: ConditionPrecedentDocumentStatus.Reviewing,
            documents_uploaded: true,
          })
          await this.applicationRepository.updateApplication({
            application_id: application.application_id,
            condition_precedent_id: conditionPrecedent.id,
          })
        } else {
          conditionPrecedent = await this.conditionPrecedentRepository.update(
            conditionPrecedent.id,
            {
              documents_uploaded: true,
              status: ConditionPrecedentStatus.Pending,
              documents_status: ConditionPrecedentDocumentStatus.Reviewing,
            },
          )
        }
      }

      return Promise.all(
        input.documents.map(async (doc) => {
          if (doc.id) {
            const applicationDocument =
              await this.documentRepository.findApplicationDocumentEntryById(
                doc.id,
              )

            if (applicationDocument) {
              let reviewRequestApprovals =
                await this.reviewRequestRepository.getReviewRequestApprovalByRequestID(
                  applicationDocument.review_request_id,
                )

              if (reviewRequestApprovals) {
                const rejectedApproval = reviewRequestApprovals.find(
                  (approval) =>
                    approval.approval_status ===
                    ReviewRequestApprovalStatus.Rejected,
                )

                if (rejectedApproval) {
                  await Promise.all([
                    this.reviewRequestRepository.updateReviewRequestApproval(
                      rejectedApproval.approval_id,
                      {
                        approval_status: ReviewRequestApprovalStatus.Pending,
                      },
                    ),
                    this.documentRepository.updateApplicationDocumentEntry(
                      applicationDocument.id,
                      { ...doc },
                    ),
                  ])

                  reviewRequestApprovals =
                    await this.reviewRequestRepository.getReviewRequestApprovalByRequestID(
                      applicationDocument.review_request_id,
                    )
                }
              }

              return reviewRequestApprovals[0]
            }
          }

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
              document_group_type_id: doc.document_group_type_id,
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
    })
  }

  async documentApprovalRespond(
    applicationId: string,
    input: ApplicationDocApprovalInput,
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

    const applicationDocEntry =
      await this.documentRepository.findApplicationDocumentEntryById(
        input.application_doc_id,
      )

    if (!applicationDocEntry) {
      throw new Error('Application document not found')
    }

    const approvals =
      await this.reviewRequestRepository.getReviewRequestApprovalByRequestID(
        applicationDocEntry.review_request_id,
      )

    const currentApproval = approvals.find(
      (approval) => approval.id === input.approval_id,
    )

    if (
      !(
        currentApproval &&
        currentApproval.organization_id === authInfo.currentOrganizationId
      ) ||
      !(
        ADMIN_LEVEL_ROLES.includes(authInfo.globalRole) ||
        currentApproval.approval_id === authInfo.userId
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You are not allowed to approve this document',
      )
    }

    const documentApprovalUpdated =
      await this.reviewRequestRepository.updateReviewRequestApproval(
        currentApproval.id,
        {
          approval_date: new Date(),
          approval_id: authInfo.userId,
          approval_status: input.approval,
        },
      )
    const user = await this.userRepository.findById(application.user_id)
    const getClientView = user ? getUserClientView(user) : null
    const getProperty = await this.propertyRepository.getPropertyById(
      application.property_id,
    )
    const getOrganizationName =
      await this.organizationRepository.getOrganizationById(
        currentApproval.organization_id,
      )

    emailTemplete.DocumentApproval(
      getClientView.email,
      `${getClientView.first_name}`,
      `${getClientView.last_name}`,
      getProperty.property_name,
      input.approval,
      getOrganizationName.name,
    )

    return documentApprovalUpdated
  }

  async hsfCompleteDocumentReview(
    applicationId: string,
    input: CompleteApplicationDocReviewInput,
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
    const user = await this.userRepository.findById(application.user_id)
    const getClientView = user ? getUserClientView(user) : null
    const getProperty = await this.propertyRepository.getPropertyById(
      application.property_id,
    )
    const getOrganizationName =
      await this.organizationRepository.getOrganizationById(
        authInfo.currentOrganizationId,
      )
    if (!application.dip) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You are yet to initiate dip',
      )
    }

    if (
      input.group === DocumentGroupKind.ConditionPrecedent &&
      !application.condition_precedent
    ) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You are yet to initiate the condition precedent stage',
      )
    }

    if (
      input.group === DocumentGroupKind.MortgageUpload &&
      application.dip.hsf_document_review_completed
    ) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        `HSF document review already completed for application ID '${applicationId}'`,
      )
    }

    if (
      input.group === DocumentGroupKind.ConditionPrecedent &&
      application.condition_precedent?.hsf_docs_reviewed
    ) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        `HSF condition precedent review already completed for application ID '${applicationId}'`,
      )
    }

    const eligibility = await this.prequalifyRepository.findEligiblityById(
      application.dip.eligibility_id,
    )

    if (
      !(
        eligibility &&
        eligibility?.eligiblity_status === EligibilityStatus.APPROVED
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Your eligibility not approved for this application',
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
        'No document group types found for the specified group.',
      )
    }

    const documentApplicationEntries =
      await this.documentRepository.findApplicationDocumentEntriesByApplicationId(
        applicationId,
      )

    let applicationEntriesWithApproval = await Promise.all(
      documentApplicationEntries.map(async (entry) => {
        const approval =
          await this.reviewRequestRepository.getReviewRequestApprovalByOrgRequestID(
            entry.review_request_id,
            authInfo.currentOrganizationId,
          )
        return {
          ...entry,
          approval,
        }
      }),
    )

    applicationEntriesWithApproval = applicationEntriesWithApproval.filter(
      (approvalEntry) =>
        documentGroupTypes.find(
          (groupType) => groupType.id === approvalEntry.document_group_type_id,
        ),
    )

    if (applicationEntriesWithApproval.length !== documentGroupTypes.length) {
      const missingGroupType = documentGroupTypes.find(
        (groupType) =>
          !applicationEntriesWithApproval.find(
            (approval) => approval.document_group_type_id === groupType.id,
          ),
      )

      if (missingGroupType) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          `Missing document group type: ${missingGroupType.display_label}.`,
        )
      } else {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'Missing document group type.',
        )
      }
    }

    const nonApprovedEntry = applicationEntriesWithApproval.find(
      (entry) =>
        entry.approval.approval_status !== ReviewRequestApprovalStatus.Approved,
    )

    if (nonApprovedEntry) {
      const nonApprovedDocumentType = documentGroupTypes.find(
        (groupType) => groupType.id === nonApprovedEntry.document_group_type_id,
      )

      if (nonApprovedDocumentType) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          `The document application '${nonApprovedDocumentType.display_label}' is not approved.`,
        )
      } else {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'Not all the document applications are approved.',
        )
      }
    }

    const reviewRequests = await Promise.all(
      applicationEntriesWithApproval.map((approval) =>
        this.reviewRequestRepository.getReviewRequestID(
          approval.review_request_id,
        ),
      ),
    )

    const lenderStage =
      await this.reviewRequestRepository.getReviewRequestStageByKind(
        ReviewRequestStageKind.DIPLenderDocumentReview,
      )

    if (!lenderStage) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Lender stage not found',
      )
    }

    const reviewRequestType =
      await this.reviewRequestRepository.getReviewRequestTypeByKind(
        ReviewRequestTypeKind.DipDocumentReview,
      )

    if (!reviewRequestType) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `${ReviewRequestTypeKind.DipDocumentReview} not found`,
      )
    }

    const reviewRequestTypeStages =
      await this.reviewRequestRepository.getReviewRequestTypeStagesByRequestTypeID(
        reviewRequestType.id,
      )

    const lenderReviewRequestTypeStage = reviewRequestTypeStages.find(
      (typeStage) => typeStage.stage_id === lenderStage.id,
    )

    if (!lenderReviewRequestTypeStage) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Lender review request type stage not found',
      )
    }

    const lender = await this.lenderRepository.getLenderById(
      eligibility.lender_id,
    )

    if (!lender) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Lender not found',
      )
    }

    return runWithTransaction(async () => {
      const approvals = await Promise.all(
        reviewRequests.map((reviewRequest) =>
          this.reviewRequestRepository.createReviewRequestApproval({
            request_id: reviewRequest.id,
            approval_status: ReviewRequestApprovalStatus.Pending,
            organization_id: lender.organization_id,
            review_request_stage_type_id: lenderReviewRequestTypeStage.id,
          }),
        ),
      )

      if (input.group === DocumentGroupKind.MortgageUpload) {
        await this.mortgageRepository.updateDipById({
          dip_id: application.dip.dip_id,
          hsf_document_review_completed: true,
        })
      } else if (input.group === DocumentGroupKind.ConditionPrecedent) {
        await this.conditionPrecedentRepository.update(
          application.condition_precedent.id,
          { hsf_docs_reviewed: true },
        )
      }
      if (ReviewRequestStatus.Pending) {
        emailTemplete.DocumentApproval(
          getClientView.email,
          `${getClientView.first_name}`,
          `${getClientView.last_name}`,
          getProperty.property_name,
          ReviewRequestApprovalStatus.Pending,
          getOrganizationName.name,
        )
      }
      //   else {
      //         emailTemplete.failedDocumentApproval(
      //       getClientView.email,
      //       `${getClientView.first_name}`,
      //       `${getClientView.last_name}`,
      //       getProperty.property_name,
      //       `The document application  is not approved.`, // Reason will be added latter
      //       getOrganizationName.name,
      //     )
      //  }

      return approvals
    })
  }

  async lenderCompleteDocumentReview(
    applicationId: string,
    input: CompleteApplicationDocReviewInput,
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

    if (!application.dip) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You are yet to initiate dip',
      )
    }

    if (
      input.group === DocumentGroupKind.ConditionPrecedent &&
      !application.condition_precedent
    ) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You are yet to initiate the condition precedent stage',
      )
    }

    if (
      input.group === DocumentGroupKind.MortgageUpload &&
      application.dip.lender_document_review_completed
    ) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        `Lender document review already completed for application ID '${applicationId}'`,
      )
    }

    if (
      input.group === DocumentGroupKind.ConditionPrecedent &&
      application.condition_precedent?.lender_docs_reviewed
    ) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        `Lender condition precedent review already completed for application ID '${applicationId}'`,
      )
    }

    const eligibility = await this.prequalifyRepository.findEligiblityById(
      application.dip.eligibility_id,
    )

    if (
      !(
        eligibility &&
        eligibility?.eligiblity_status === EligibilityStatus.APPROVED
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Your eligibility not approved for this application',
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
        'No document group types found for the specified group.',
      )
    }

    const documentApplicationEntries =
      await this.documentRepository.findApplicationDocumentEntriesByApplicationId(
        applicationId,
      )

    let applicationEntriesWithApproval = await Promise.all(
      documentApplicationEntries.map(async (entry) => {
        const approval =
          await this.reviewRequestRepository.getReviewRequestApprovalByOrgRequestID(
            entry.review_request_id,
            authInfo.currentOrganizationId,
          )
        return {
          ...entry,
          approval,
        }
      }),
    )

    applicationEntriesWithApproval = applicationEntriesWithApproval.filter(
      (approvalEntry) =>
        documentGroupTypes.find(
          (groupType) => groupType.id === approvalEntry.document_group_type_id,
        ),
    )

    if (applicationEntriesWithApproval.length !== documentGroupTypes.length) {
      const missingGroupType = documentGroupTypes.find(
        (groupType) =>
          !applicationEntriesWithApproval.find(
            (approval) => approval.document_group_type_id === groupType.id,
          ),
      )

      if (missingGroupType) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          `Missing document group type: ${missingGroupType.display_label}.`,
        )
      } else {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'Missing document group type.',
        )
      }
    }

    const nonApprovedEntry = applicationEntriesWithApproval.find(
      (entry) =>
        entry.approval.approval_status !== ReviewRequestApprovalStatus.Approved,
    )

    if (nonApprovedEntry) {
      const nonApprovedDocumentType = documentGroupTypes.find(
        (groupType) => groupType.id === nonApprovedEntry.document_group_type_id,
      )

      if (nonApprovedDocumentType) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          `The document application '${nonApprovedDocumentType.display_label}' is not approved.`,
        )
      } else {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'Not all the document applications are approved.',
        )
      }
    }

    const lenderOrg = await this.lenderRepository.getLenderById(
      eligibility.lender_id,
    )

    if (!lenderOrg) {
      throw new Error('Lender not found')
    }

    return runWithTransaction(async () => {
      await Promise.all(
        application.stages?.map(async (stage) => {
          if (stage.exit_time) return null
          await this.applicationRepository.updateApplicationStage(stage.id, {
            exit_time: new Date(),
          })
        }),
      )

      if (input.group === DocumentGroupKind.MortgageUpload) {
        const loanOffer = await this.loanOfferRepository.createLoanOffer({
          user_id: application.user_id,
          application_id: application.application_id,
          lender_org_id: lenderOrg.organization_id,
          offer_date: new Date(),
          offer_status: LoanOfferStatus.PENDING,
          expiry_date: createDate(new TimeSpan(14, 'd')),
          interest_rate: application.dip.interest_rate,
          loan_amount: application.dip.approved_loan_amount,
          loan_term_months: Number(application.dip.loan_term),
          repayment_frequency: LoanRepaymentFrequency.MONTHLY,
        })

        await this.loanAgreementRepository.createLoanAgreement({
          lender_org_id: lenderOrg.organization_id,
          loan_offer_id: loanOffer.id,
          status: LoanAgreementStatus.PendingApproval,
          user_id: application.user_id,
          application_id: application.application_id,
        })

        await this.applicationRepository.addApplicationStage(
          application.application_id,
          {
            entry_time: new Date(),
            application_id: application.application_id,
            user_id: application.user_id,
            stage: MortgageApplicationStage.LoanDecision,
          },
        )

        await this.loanDecisionRepository.create({
          application_id: application.application_id,
          user_id: application.user_id,
          status: LoanDecisionStatus.PENDING,
          lender_org_id: lenderOrg.organization_id,
          loan_offer_id: loanOffer.id,
        })

        await this.applicationRepository.updateApplication({
          application_id: application.application_id,
          loan_offer_id: loanOffer.id,
        })

        await this.mortgageRepository.updateDipById({
          dip_id: application.dip.dip_id,
          lender_document_review_completed: true,
          dip_status: DIPStatus.Completed,
          documents_status: DipDocumentReviewStatus.Approved,
        })
      } else if (input.group === DocumentGroupKind.ConditionPrecedent) {
        await this.conditionPrecedentRepository.update(
          application.condition_precedent.id,
          {
            lender_docs_reviewed: true,
            status: ConditionPrecedentStatus.Completed,
            documents_status: ConditionPrecedentDocumentStatus.Verified,
          },
        )

        await this.applicationRepository.addApplicationStage(
          application.application_id,
          {
            entry_time: new Date(),
            application_id: application.application_id,
            user_id: application.user_id,
            stage: MortgageApplicationStage.Repayment,
          },
        )
      }

      const [status] = await Promise.all(
        applicationEntriesWithApproval.map((approval) =>
          this.reviewRequestRepository.updateReviewRequest(
            approval.approval.request_id,
            {
              status: ReviewRequestStatus.Approved,
            },
          ),
        ),
      )
      const user = await this.userRepository.findById(application.user_id)
      const getClientView = user ? getUserClientView(user) : null
      const getProperty = await this.propertyRepository.getPropertyById(
        application.property_id,
      )
      const getOrganizationName =
        await this.organizationRepository.getOrganizationById(
          getProperty.organization_id,
        )
      if (status.status === ReviewRequestStatus.Approved) {
        emailTemplete.DocumentCompleteReview(
          getClientView.email,
          `${getClientView.first_name}`,
          `${getClientView.last_name}`,
          getProperty.property_name,
          application.application_id,
          getOrganizationName.name,
        )
      } else {
        emailTemplete.failedDocumentApproval(
          getClientView.email,
          `${getClientView.first_name}`,
          `${getClientView.last_name}`,
          getProperty.property_name,
          `The document application  is not approved.`, // Reason will be added latter
          getOrganizationName.name,
        )
      }
    })
  }

  async homeBuyerLoanOfferRespond(
    input: HomeBuyserLoanOfferRespondInput,
    applicationId: string,
    authInfo: AuthInfo,
  ) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!(application && application.user_id === authInfo.userId)) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        `Application with ID '${applicationId}' not found.`,
      )
    }

    if (!application.loan_offer_id) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'No active loan offer found',
      )
    }

    if (application.loan_offer_id !== input.loan_offer_id) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        `Loan offer ID mismatch. Expected '${application.loan_offer_id}', but got '${input.loan_offer_id}'.`,
      )
    }

    const loanOffer = await this.loanOfferRepository.getLoanOfferById(
      application.loan_offer_id,
    )

    if (!loanOffer) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Loan offer not found',
      )
    }

    if (loanOffer.workflow_status !== LoanOfferWorkflowStatus.READY) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Loan offer is not ready to be processed.',
      )
    }

    return runWithTransaction(async () => {
      const updateLoanOffer = await this.loanOfferRepository.updateLoanOffer(
        loanOffer.id,
        {
          offer_status: input.accepts
            ? LoanOfferStatus.ACCEPTED
            : LoanOfferStatus.DECLINED,
        },
      )

      return updateLoanOffer
    })
  }

  async submitSignedLoanOfferLetter(
    applicationId: string,
    input: SubmitSignedLoanOfferLetterInput,
    authInfo: AuthInfo,
  ) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!(application && application.user_id === authInfo.userId)) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        `Application with ID '${applicationId}' not found.`,
      )
    }

    if (!application.loan_offer_id) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'No active loan offer found',
      )
    }

    if (application.loan_offer_id !== input.loan_offer_id) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        `Loan offer ID mismatch. Expected '${application.loan_offer_id}', but got '${input.loan_offer_id}'.`,
      )
    }

    const loanOffer = await this.loanOfferRepository.getLoanOfferById(
      application.loan_offer_id,
    )

    if (!loanOffer) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Loan offer not found',
      )
    }

    if (loanOffer.workflow_status !== LoanOfferWorkflowStatus.READY) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Loan offer is not ready to be processed.',
      )
    }

    return runWithTransaction(async () => {
      const updatedLoanOffer = await this.loanOfferRepository.updateLoanOffer(
        loanOffer.id,
        {
          signed_loan_offer_letter_url: input.signed_loan_offer_letter_url,
        },
      )

      return updatedLoanOffer
    })
  }

  async getApplicationStages(applicationId: string, authInfo: AuthInfo) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!canAccessApplication(application)(authInfo)) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        `Application with ID '${applicationId}' not found.`,
      )
    }

    const stages = getApplicationStages(application.application_type)

    const stageMap: Map<string, ApplicationStage> = new Map(
      application.stages?.map((stage) => [stage.stage, stage]) ?? [],
    )

    return stages.map<ApplicationStage>((stage) => {
      const existingStage = stageMap.get(stage.stage)
      return {
        id: existingStage?.id ?? null,
        stage: stage.stage,
        user_id: application.user_id,
        entry_time: new Date(),
        exit_time: existingStage?.exit_time ?? null,
        application_id: application.application_id,
        created_at: application.created_at ?? new Date(),
        updated_at: application.updated_at ?? new Date(),
      }
    })
  }

  async getActiveApplicationLoan(applicationId: string, authInfo: AuthInfo) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!canAccessApplication(application)(authInfo)) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        `Application with ID '${applicationId}' not found.`,
      )
    }

    if (!application.loan_offer_id) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'No active loan found for this application',
      )
    }

    const loanOffer = await this.loanOfferRepository.getLoanOfferById(
      application.loan_offer_id,
    )

    if (!loanOffer) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Unable to find the loan offer',
      )
    }

    const loan = await this.loanRepository.getLoanByOfferId(
      application.loan_offer_id,
    )

    if (!loan) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'No active loan found for this application',
      )
    }

    const repayments =
      await this.loanRepaymentScheduleRepository.getLoanRepaymentScheduleByLoanId(
        loan.id,
      )

    return {
      ...loan,
      loan_offer: loanOffer,
      repayments,
    }
  }

  async getApplicationLoanRepayment(
    applicationId: string,
    loanId: string,
    authInfo: AuthInfo,
  ) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!canAccessApplication(application)(authInfo)) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        `Application with ID '${applicationId}' not found.`,
      )
    }

    if (!application.loan_offer_id) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'No active loan found for this application',
      )
    }

    const loan = await this.loanRepository.getLoanById(loanId)

    if (!(loan && loan.user_id === application.user_id)) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'Loan not found ')
    }

    const loanOffer = await this.loanOfferRepository.getLoanOfferById(
      application.loan_offer_id,
    )

    if (loanOffer && loanOffer.id !== loan.loan_offer_id) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Loan not linked to this application',
      )
    }

    const loanRepayments =
      await this.loanRepaymentScheduleRepository.getLoanRepaymentScheduleByLoanId(
        loanId,
      )

    return Promise.all(
      loanRepayments.map(async (repayment) => {
        const transaction =
          await this.loanRepaymentTransactionRepository.getLoanRepaymentTransactionRepaymentId(
            repayment.id,
          )

        return {
          ...repayment,
          transaction,
        }
      }),
    )
  }

  async getApplicationLender(applicationId: string, authInfo: AuthInfo) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!canAccessApplication(application)(authInfo)) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        `Application with ID '${applicationId}' not found.`,
      )
    }

    if (!application.loan_offer_id) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'No active loan found for this application',
      )
    }

    if (
      !(
        application.prequalify_personal_information &&
        application.prequalify_personal_information.eligibility.lender_id
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'No lender institution found',
      )
    }

    const lender = await this.lenderRepository.getLenderById(
      application.prequalify_personal_information.eligibility.lender_id,
    )

    if (lender) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'No lender institution found',
      )
    }

    const organization = await this.organizationRepository.getOrganizationById(
      lender.organization_id,
    )

    return {
      ...organization,
      lender_profile: lender,
    }
  }

  async setLenderLoanAgreementDoc(
    applicationId: string,
    input: UploadLoanAgreementDocInput,
    authInfo: AuthInfo,
  ) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!canAccessApplication(application)(authInfo)) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        `Application with ID '${applicationId}' not found.`,
      )
    }

    let loanOffer = application.loan_offer_id
      ? await this.loanOfferRepository.getLoanOfferById(
          application.loan_offer_id,
        )
      : null

    if (!loanOffer) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'No loan offer found',
      )
    }

    const loanAgreement =
      await this.loanAgreementRepository.getLoanAgreementById(
        input.loan_agreement_id,
      )

    const currentOfferAgreement =
      await this.loanAgreementRepository.getLoanAgreementByOfferId(loanOffer.id)

    if (!currentOfferAgreement) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'No loan agreement set on this application',
      )
    }

    if (!(loanAgreement && loanAgreement.id === currentOfferAgreement.id)) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Loan agreement not found or match what on the application',
      )
    }

    return runWithTransaction(async () => {
      await this.documentRepository.createApplicationDocumentEntry({
        document_name: 'Loan agreement',
        document_url: input.url,
      })
    })
  }

  async setApplicationLoanOfficer(
    applicationId: string,
    input: SetApplicationLoanOfficerInput,
    authInfo: AuthInfo,
  ) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!canAccessApplication(application)(authInfo)) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        `Application with ID '${applicationId}' not found.`,
      )
    }

    if (application.application_type !== ApplicationPurchaseType.MORTGAGE) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Loan officer can only be set for mortgage applications.',
      )
    }

    const eligibility = application.eligibility_id
      ? await this.prequalifyRepository.findEligiblityById(
          application.eligibility_id,
        )
      : null

    if (!eligibility) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Application eligibility information is required to set loan officer.',
      )
    }

    const lender = await this.lenderRepository.getLenderById(
      eligibility.lender_id,
    )

    if (!lender) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Associated lender partner not found.',
      )
    }

    if (lender.organization_id !== authInfo.currentOrganizationId) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You do not have permission to set loan officer for this lender.',
      )
    }

    if (input.loan_officer_id) {
      const loanOfficer =
        await this.organizationRepository.getOrgenizationMemberByUserId(
          input.loan_officer_id,
        )
      if (!loanOfficer) {
        throw new ApplicationCustomError(
          StatusCodes.NOT_FOUND,
          'Specified loan officer not found in organization.',
        )
      }
      if (loanOfficer.role?.name !== Role.LENDER_LOAN_OFFICER) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'User does not have the required loan officer role.',
        )
      }
    }

    await runWithTransaction(async () => {
      const { result: loanOfficerAssigments } =
        await this.userAssignmentRepository.findByAssignable(
          application.application_id,
          AssignableType.LOAN,
          { page_number: 1, result_per_page: Number.MAX_SAFE_INTEGER },
        )

      if (application.current_loan_officer_assignment_id) {
        const loanOfficerAssignment = loanOfficerAssigments.find(
          (assignment) =>
            assignment.id === application.current_loan_officer_assignment_id,
        )

        if (loanOfficerAssignment) {
          await this.userAssignmentRepository.update(loanOfficerAssignment.id, {
            unassigned_at: new Date(),
          })
        }
      }

      if (
        application.current_loan_officer_assignment_id &&
        application.current_loan_officer_assignment_id === input.loan_officer_id
      ) {
        throw new ApplicationCustomError(
          StatusCodes.CONFLICT,
          'Loan officer already set',
        )
      }

      let currentLoanOfficerAssignmentId: string | null = null
      let existingLoanOfficer = loanOfficerAssigments.find(
        (assignment) => assignment.user_id === input.loan_officer_id,
      )

      if (existingLoanOfficer) {
        existingLoanOfficer = await this.userAssignmentRepository.update(
          existingLoanOfficer.id,
          {
            assigned_at: new Date(),
            unassigned_at: null,
            created_by_user_id: authInfo.userId,
          },
        )
        currentLoanOfficerAssignmentId = existingLoanOfficer.id
      } else if (input.loan_officer_id) {
        const currentLoanOfficer = await this.userAssignmentRepository.create({
          assignable_id: application.application_id,
          assignable_type: AssignableType.LOAN,
          user_id: input.loan_officer_id,
          role: UserAssignmentRole.LOAN_OFFICER,
          assigned_at: new Date(),
          created_by_user_id: authInfo.userId,
        })
        currentLoanOfficerAssignmentId = currentLoanOfficer.id
      }

      return this.applicationRepository.updateApplication({
        application_id: application.application_id,
        current_loan_officer_assignment_id: currentLoanOfficerAssignmentId,
      })
    })
  }
}
