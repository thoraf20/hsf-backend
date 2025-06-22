import { OrganizationType } from '@domain/enums/organizationEnum'
import {
  DIPLenderStatus,
  LoanOfferStatus,
  OfferLetterStatus,
} from '@domain/enums/propertyEnum'
import { Application } from '@entities/Application'
import { DIP } from '@entities/Mortage'
import { ReviewRequestApprovalStatus } from '@entities/Request'
import { createResponse } from '@presentation/response/responseType'
import { Role } from '@routes/index.t'
import { AuthInfo } from '@shared/utils/permission-policy'
import { ApplicationService } from '@use-cases/Application/application'
import { ManageDipUseCase } from '@use-cases/Developer/ManageDip'
import { ManageInspectionUseCase } from '@use-cases/Developer/ManageInpections'
import { PaymentUseCase } from '@use-cases/Payments/payments'
import {
  ApplicationDocApprovalInput,
  ApplicationDocFilters,
  ApplicationDocUploadsInput,
  ApplicationFilters,
  CreateApplicationInput,
  DipFilters,
  CompleteApplicationDocReviewInput,
  InitiateMortgagePayment,
  LenderDipResponse,
  OfferLetterFilters,
  RequestOfferLetterRespondInput,
  RequestPropertyClosingInput,
  ScheduleEscrowMeetingInput,
  ScheduleEscrowMeetingRespondInput,
  UpdateDipLoanInput,
  HomeBuyserLoanOfferRespondInput,
  SubmitSignedLoanOfferLetterInput,
  SetApplicationLoanOfficerInput,
} from '@validators/applicationValidator'
import { InspectionFilters } from '@validators/inspectionVaidator'
import { PaymentFilters } from '@validators/paymentValidator'
import { PropertyFilters } from '@validators/propertyValidator'
import { StatusCodes } from 'http-status-codes'

export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly manageInspectionService: ManageInspectionUseCase,
    private readonly manageDipService: ManageDipUseCase,
    private readonly paymentService: PaymentUseCase,
  ) {}

  async create(userId: string, input: CreateApplicationInput) {
    const application = await this.applicationService.create(userId, input)
    return createResponse(
      StatusCodes.CREATED,
      'Application intiated successfully',
      { application },
    )
  }

  async getAllByUserId(userId: string, filter: ApplicationFilters) {
    const applicationContents = await this.applicationService.getByUserId(
      userId,
      filter,
    )

    return createResponse(
      StatusCodes.OK,
      'Application retrived successfully',
      applicationContents,
    )
  }

  async getAllPropertyClosingsByHSF(filter: PropertyFilters) {
    const propertyClosings =
      await this.applicationService.getAllPropertyClosingsByHSF(filter)

    return createResponse(
      StatusCodes.OK,
      'Property closings retrieved successfully',
      propertyClosings,
    )
  }

  async getById(id: string, authInfo: AuthInfo) {
    const application = await this.applicationService.getById(id, authInfo)

    return createResponse(StatusCodes.OK, 'Application retrived successfully', {
      application,
    })
  }

  async getByDeveloperOrg(organizationId: string, filter: ApplicationFilters) {
    const applicationContents = await this.applicationService.getByDeveloperOrg(
      organizationId,
      filter,
    )

    return createResponse(
      StatusCodes.OK,
      'Application retrived successfully',
      applicationContents,
    )
  }

  async getByHSF(filter: ApplicationFilters) {
    const applicationContents = await this.applicationService.getByHSF(filter)

    return createResponse(
      StatusCodes.OK,
      'Application retrived successfully',
      applicationContents,
    )
  }

  async getByLender(filter: ApplicationFilters, authInfo: AuthInfo) {
    const applicationContents = await this.applicationService.getByLender(
      filter,
      authInfo,
    )

    return createResponse(
      StatusCodes.OK,
      'Application retrived successfully',
      applicationContents,
    )
  }

  async requestOfferLetter(applicationId: string, userId: string) {
    const offerLetter = await this.applicationService.requestOfferLetter(
      applicationId,
      userId,
    )

    return createResponse(
      StatusCodes.CREATED,
      'Request for offer letter successful',
      {
        offer_letter: offerLetter,
      },
    )
  }

  async getApplicationOfferLetter(applicationId: string, userId: string) {
    const offerLetter =
      await this.applicationService.getOfferLetterByApplicationId(
        applicationId,
        userId,
      )

    return createResponse(StatusCodes.OK, '', { offer_letter: offerLetter })
  }

  async requestPropertyClosing(applicationId: string, userId: string) {
    const propertyClosing =
      await this.applicationService.requestPropertyClosing(
        applicationId,
        userId,
      )

    return createResponse(
      StatusCodes.OK,
      'Your request for propert closing is accepeted',
      {
        property_closing: propertyClosing,
      },
    )
  }

  async propertyClosingRespond(
    applicationId: string,
    input: RequestPropertyClosingInput,
  ) {
    const propertyClosing =
      await this.applicationService.propertyClosingRespond(applicationId, input)

    return createResponse(StatusCodes.OK, 'Property closing status updated', {
      property_closing: propertyClosing,
    })
  }

  async requestOfferLetterRespond(
    organizationId: string,
    userId: string,
    applicationId: string,
    input: RequestOfferLetterRespondInput,
  ) {
    const offerLetter = await this.applicationService.requestOfferLetterRespond(
      organizationId,
      userId,
      applicationId,
      input,
    )

    return createResponse(
      StatusCodes.OK,
      input.offer_letter_status === OfferLetterStatus.Approved
        ? 'Offer letter approved successfully'
        : 'Offer letter rejected successfully',
      { offer_letter: offerLetter },
    )
  }

  async scheduleEscrowMeeting(
    applicationId: string,
    authInfo: AuthInfo,
    input: ScheduleEscrowMeetingInput,
  ) {
    const escrowAttendance =
      await this.applicationService.scheduleEscrowMeeting(
        applicationId,
        authInfo,
        input,
      )

    return createResponse(
      StatusCodes.CREATED,
      'Escrow attendance meeting placed successfully',
      {
        escrow_attendance: escrowAttendance,
      },
    )
  }

  async getEscrowMeetingStatus(applicationId: string, authInfo: AuthInfo) {
    const escrowMeetingStatus =
      await this.applicationService.getEscrowMeetingStatus(
        applicationId,
        authInfo,
      )

    return createResponse(
      StatusCodes.OK,
      'Escrow Meeting status fetched successfully',
      escrowMeetingStatus,
    )
  }

  async scheduleEscrowMeetingRespond(
    applicationId: string,
    authInfo: AuthInfo,
    input: ScheduleEscrowMeetingRespondInput,
  ) {
    const escrowMeeting =
      await this.applicationService.scheduleEscrowMeetingRespond(
        applicationId,
        authInfo,
        input,
      )

    return createResponse(StatusCodes.OK, 'Escrow Meeting Accepted', {
      escrow_meeting: escrowMeeting,
    })
  }

  async getOfferLetter(authInfo: AuthInfo, filters: OfferLetterFilters) {
    const offerLetters = await this.applicationService.getOfferLetters(
      authInfo,
      filters,
    )

    return createResponse(
      StatusCodes.OK,
      'Offer Letter retrieved successfully',
      offerLetters,
    )
  }

  async getRequiredDoc(
    applicationId: string,
    filters: ApplicationDocFilters,
    authInfo: AuthInfo,
  ) {
    const contents = await this.applicationService.getRequiredDoc(
      applicationId,
      filters,
      authInfo,
    )

    return createResponse(
      StatusCodes.OK,
      'Document Required fetched successfully',
      { documents: contents },
    )
  }

  async getApplicationDocumentGroups(
    applicationId: string,
    authInfo: AuthInfo,
  ) {
    const contents = await this.applicationService.getApplicationDocGroups(
      applicationId,
      authInfo,
    )

    return createResponse(
      StatusCodes.OK,
      'Document Required fetched successfully',
      { documents: contents },
    )
  }

  async getFilledDocs(
    applicationId: string,
    filters: ApplicationDocFilters,
    authInfo: AuthInfo,
  ) {
    const contents = await this.applicationService.getFilledDocs(
      applicationId,
      filters,
      authInfo,
    )

    return createResponse(
      StatusCodes.OK,
      'Document Filled fetched successfully',
      contents,
    )
  }

  async getInspectionsByApplicationId(
    applicationId: string,
    authInfo: AuthInfo,
  ) {
    const contents =
      await this.manageInspectionService.getInspectionByApplicationId(
        applicationId,
      )

    return createResponse(
      StatusCodes.OK,
      'Inspections retrieved successfully',
      contents,
    )
  }

  async getInspections(authInfo: AuthInfo, filters: InspectionFilters) {
    const contents = await this.manageInspectionService.getAllInspections({
      ...filters,
      ...(authInfo.organizationType === OrganizationType.DEVELOPER_COMPANY
        ? { organization_id: authInfo.currentOrganizationId }
        : null),
    })

    return createResponse(
      StatusCodes.OK,
      'Inspections retrieved successfully',
      contents,
    )
  }

  async getInspect(applicationId: string, authInfo: AuthInfo) {
    const contents =
      await this.manageInspectionService.getAllInspectionList(applicationId)

    return createResponse(
      StatusCodes.OK,
      'Inspections retrieved successfully',
      contents,
    )
  }

  async getDips(authInfo: AuthInfo, filters: DipFilters) {
    const dipContents = await this.manageDipService.getDips(authInfo, filters)

    return createResponse(
      StatusCodes.OK,
      'Dips retrived successfully',
      dipContents,
    )
  }

  async getApplicationDipById(applicationId: string, dipId: string) {
    const dip = await this.manageDipService.getDipById(applicationId, dipId)

    return createResponse(StatusCodes.OK, 'Dip retrived succesfully', dip)
  }

  async updateApplicationDipById(
    applicationId: string,
    dipId: string,
    input: UpdateDipLoanInput,
  ) {
    const updatedDip = await this.manageDipService.updateDip(
      applicationId,
      dipId,
      input,
    )

    return createResponse(
      StatusCodes.OK,
      'Dip updated successfully',
      updatedDip,
    )
  }

  async lenderDipRespond(
    applicationId: string,
    dipId: string,
    input: LenderDipResponse,
  ) {
    const updatedDip = await this.manageDipService.lenderDipResponse(
      applicationId,
      dipId,
      input,
    )

    return createResponse(
      StatusCodes.OK,
      updatedDip.dip_lender_status === DIPLenderStatus.Accepted
        ? 'Dip approved successfully'
        : 'Dip rejected successfully',
      updatedDip,
    )
  }

  async userDipRespond(
    authInfo: AuthInfo,
    applicationId: string,
    dipId: string,
    input: LenderDipResponse,
  ) {
    const updatedDip = await this.manageDipService.userDipResponse(
      authInfo,
      applicationId,
      dipId,
      input,
    )

    return createResponse(
      StatusCodes.OK,
      updatedDip.dip_lender_status === DIPLenderStatus.Accepted
        ? 'Dip accepted successfully'
        : 'Dip rejected successfully',
      updatedDip,
    )
  }

  async initiateMortgagePaymentIntent(
    authInfo: AuthInfo,
    applicationId: string,
    input: InitiateMortgagePayment,
  ) {
    const application = (await this.applicationService.getById(
      applicationId,
      authInfo,
    )) as Application & { dip?: DIP }

    const paymentIntent =
      await this.paymentService.inititateMortgagePaymentIntent(
        authInfo,
        application,
        input,
      )

    return createResponse(
      StatusCodes.OK,
      'Payment intent generated',
      paymentIntent,
    )
  }

  async getApplicationPayments(
    authInfo: AuthInfo,
    applicationId: string,
    query: PaymentFilters,
  ) {
    let user_id: string

    if (authInfo.globalRole === Role.HOME_BUYER) {
      user_id = authInfo.userId
    }

    const payments = await this.paymentService.getAll({
      ...query,
      application_id: applicationId,
      user_id,
    })

    return createResponse(
      StatusCodes.OK,
      'Application payment retrived successfully',
      payments,
    )
  }

  async handleApplicationDocUploads(
    applicationId: string,
    input: ApplicationDocUploadsInput,
    authInfo: AuthInfo,
  ) {
    const documentReview =
      await this.applicationService.handleApplicationDocUploads(
        applicationId,
        input,
        authInfo,
      )

    return createResponse(
      StatusCodes.OK,
      'Application documents uploades successfully',
      { reviews: documentReview },
    )
  }

  async documentApprovalRespond(
    applicationId: string,
    input: ApplicationDocApprovalInput,
    authInfo: AuthInfo,
  ) {
    const approval = await this.applicationService.documentApprovalRespond(
      applicationId,
      input,
      authInfo,
    )

    return createResponse(
      StatusCodes.OK,
      approval.approval_status === ReviewRequestApprovalStatus.Approved
        ? 'Application document approved successfully'
        : 'Application document rejected successfully',
    )
  }

  async hsfCompleteDocumentReview(
    applicationId: string,
    input: CompleteApplicationDocReviewInput,
    authInfo: AuthInfo,
  ) {
    const approvals = await this.applicationService.hsfCompleteDocumentReview(
      applicationId,
      input,
      authInfo,
    )

    return createResponse(
      StatusCodes.OK,
      'HSF application approval completed',
      approvals,
    )
  }

  async lenderCompleteDocumentReview(
    applicationId: string,
    input: CompleteApplicationDocReviewInput,
    authInfo: AuthInfo,
  ) {
    const approvals =
      await this.applicationService.lenderCompleteDocumentReview(
        applicationId,
        input,
        authInfo,
      )

    return createResponse(
      StatusCodes.OK,
      'Lender application approval completed',
      approvals,
    )
  }

  async homeBuyerLoanOfferRespond(
    input: HomeBuyserLoanOfferRespondInput,
    applicationId: string,
    authInfo: AuthInfo,
  ) {
    const loanOffer = await this.applicationService.homeBuyerLoanOfferRespond(
      input,
      applicationId,
      authInfo,
    )

    return createResponse(
      StatusCodes.OK,
      loanOffer.offer_status === LoanOfferStatus.ACCEPTED
        ? 'Loan offer accepted successfully'
        : 'Loan offer declined successfully',
      loanOffer,
    )
  }

  async submitSignedLoanOfferLetter(
    applicationId: string,
    input: SubmitSignedLoanOfferLetterInput,
    authInfo: AuthInfo,
  ) {
    const loanOffer = await this.applicationService.submitSignedLoanOfferLetter(
      applicationId,
      input,
      authInfo,
    )

    return createResponse(
      StatusCodes.OK,
      `Signed Loan offer letter submitted successfully`,
      loanOffer,
    )
  }

  async getApplicationStages(applicationId: string, authInfo: AuthInfo) {
    const stages = await this.applicationService.getApplicationStages(
      applicationId,
      authInfo,
    )

    return createResponse(
      StatusCodes.OK,
      'Application stages retrieved successfully',
      stages,
    )
  }

  async getActiveApplicationLoan(applicationId: string, authInfo: AuthInfo) {
    const loan = await this.applicationService.getActiveApplicationLoan(
      applicationId,
      authInfo,
    )

    return createResponse(
      StatusCodes.OK,
      'Application Loan retrieved successfully',
      loan,
    )
  }

  async getApplicationLoanRepayment(
    applicationId: string,
    loanId: string,
    authInfo: AuthInfo,
  ) {
    const repayments =
      await this.applicationService.getApplicationLoanRepayment(
        applicationId,
        loanId,
        authInfo,
      )

    return createResponse(
      StatusCodes.OK,
      'Loan repayments retrieved successfully',
      repayments,
    )
  }

  async getApplicationLender(applicationId: string, authInfo: AuthInfo) {
    const lender = await this.applicationService.getApplicationLender(
      applicationId,
      authInfo,
    )

    return createResponse(
      StatusCodes.OK,
      'Lender retrieved successfully',
      lender,
    )
  }

  async setApplicationLoanOfficier(
    applicationId: string,
    input: SetApplicationLoanOfficerInput,
    authInfo: AuthInfo,
  ) {
    const application = await this.applicationService.setApplicationLoanOfficer(
      applicationId,
      input,
      authInfo,
    )

    return createResponse(
      StatusCodes.OK,
      input.loan_officer_id
        ? 'Loan officer set successfully'
        : 'Loan officer removed successfully',
      application,
    )
  }
}
