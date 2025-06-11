import { OfferLetterRepository } from '@repositories/property/OfferLetterRepository'
import { ApplicationController } from '@controllers/property/application.controller'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { authorize } from '@middleware/authorization'
import { validateRequest } from '@middleware/validateRequest'
import { PrequalifyRepository } from '@repositories/prequalify/prequalifyRepository'
import { ApplicationRepository } from '@repositories/property/ApplicationRespository'
import { PropertyPurchaseRepository } from '@repositories/property/PropertyPurchaseRepository'
import { PropertyRepository } from '@repositories/property/PropertyRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { asyncMiddleware, requireRoles, Role } from '@routes/index.t'
import { validateRequestQuery } from '@shared/utils/paginate'
import {
  All,
  isHomeBuyer,
  isOrganizationUser,
  RequireAny,
  requireOrganizationType,
} from '@shared/utils/permission-policy'

import { ApplicationService } from '@use-cases/Application/application'
import {
  applicationDocApprovalSchema,
  applicationDocFilterSchema,
  applicationDocUploadsSchema,
  createApplicationSchema,
  dipFiltersSchema,
  completeApplicationDocReviewSchema,
  initiateMortgagePaymentSchema,
  lenderDipResponseSchema,
  offerLetterFiltersSchema,
  requestOfferLetterRespondSchema,
  requestPropertyClosingSchema,
  scheduleEscrowMeetingRespondSchema,
  scheduleEscrowMeetingSchema,
  updateDipLoanSchema,
  userDipResponseSchema,
  homeBuyerLoanOfferRespondSchema,
  submitSignedLoanOfferLetterSchema,
} from '@validators/applicationValidator'
import { propertyFiltersSchema } from '@validators/propertyValidator'
import { Router } from 'express'
import { ReviewRequestRepository } from '@application/repositories/ReviewRequestRepository'
import { OrganizationRepository } from '@repositories/OrganizationRepository'
import { DocumentRepository } from '@repositories/property/DcoumentRepository'
import { ManageInspectionUseCase } from '@use-cases/Developer/ManageInpections'
import { ManageInspectionRepository } from '@repositories/Developer/ManageInspectionsRespository'
import { DeveloperRespository } from '@repositories/Agents/DeveloperRepository'
import { InspectionRepository } from '@repositories/property/Inspection'
import { ManageDipUseCase } from '@use-cases/Developer/ManageDip'
import { MortageRepository } from '@repositories/property/MortageRepository'
import { AddressRepository } from '@repositories/user/AddressRepository'
import { inspectionFiltersSchema } from '@validators/inspectionVaidator'
import { LenderRepository } from '@repositories/Agents/LenderRepository'
import { PaymentUseCase } from '@use-cases/Payments/payments'
import { PaymentRepostory } from '@repositories/PaymentRepository'
import { ServiceOfferingRepository } from '@repositories/serviceOffering/serviceOfferingRepository'
import { PaymentService } from '@infrastructure/services/paymentService.service'
import { PaymentProcessorFactory } from '@infrastructure/services/factoryProducer'
import { paymentFiltersSchema } from '@validators/paymentValidator'
import { LoanOfferRepository } from '@repositories/loans/LoanOfferRepository'
import { LoanDecisionRepository } from '@repositories/loans/LoanDecisionRepository'
import { ConditionPrecedentRepository } from '@repositories/loans/ConditionPrecedentRepository'
import { LoanRepository } from '@repositories/loans/LoanRepository'
import { LoanRepaymentScheduleRepository } from '@repositories/loans/LoanRepaymentRepository'

const applicationService = new ApplicationService(
  new ApplicationRepository(),
  new PropertyRepository(),
  new PrequalifyRepository(),
  new PropertyPurchaseRepository(),
  new UserRepository(),
  new OfferLetterRepository(),
  new ReviewRequestRepository(),
  new OrganizationRepository(),
  new DocumentRepository(),
  new DeveloperRespository(),
  new MortageRepository(),
  new LenderRepository(),
  new LoanOfferRepository(),
  new LoanDecisionRepository(),
  new ConditionPrecedentRepository(),
  new LoanRepository(),
  new LoanRepaymentScheduleRepository(),
)
const manageDipService = new ManageDipUseCase(
  new MortageRepository(),
  new UserRepository(),
  new PrequalifyRepository(),
  new ApplicationRepository(),
  new AddressRepository(),
  new LenderRepository(),
)

const manageInspectionRepository = new ManageInspectionRepository()
const organizationRepository = new OrganizationRepository()
const applicationController = new ApplicationController(
  applicationService,
  new ManageInspectionUseCase(
    manageInspectionRepository,
    organizationRepository,
    new ApplicationRepository(),
    new PropertyRepository(),
    new UserRepository(),
    new DeveloperRespository(),
    new InspectionRepository(),
  ),
  manageDipService,
  new PaymentUseCase(
    new PaymentRepostory(),
    new ServiceOfferingRepository(),
    new UserRepository(),
    new PaymentService(new PaymentProcessorFactory()),
    new MortageRepository(),
    new LoanDecisionRepository(),
  ),
)
const applicationRoutes = Router()

applicationRoutes.post(
  '/',
  validateRequest(createApplicationSchema),
  asyncMiddleware(async (req, res) => {
    const { user: claim, body } = req
    const response = await applicationController.create(claim.id, body)
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/developer',
  validateRequestQuery(propertyFiltersSchema),
  authorize(requireOrganizationType(OrganizationType.DEVELOPER_COMPANY)),
  asyncMiddleware(async (req, res) => {
    const { query, authInfo } = req
    const response = await applicationController.getByDeveloperOrg(
      authInfo.currentOrganizationId,
      query,
    )
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/hsf',
  validateRequestQuery(propertyFiltersSchema),
  authorize(requireOrganizationType(OrganizationType.HSF_INTERNAL)),
  asyncMiddleware(async (req, res) => {
    const { query } = req

    const response = await applicationController.getByHSF(query)
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/lender',
  validateRequestQuery(propertyFiltersSchema),
  authorize(requireOrganizationType(OrganizationType.LENDER_INSTITUTION)),
  asyncMiddleware(async (req, res) => {
    const { query } = req

    const response = await applicationController.getByLender(query)
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/user',
  validateRequestQuery(propertyFiltersSchema),
  requireRoles(Role.HOME_BUYER),
  asyncMiddleware(async (req, res) => {
    const { user: claim, query } = req

    const response = await applicationController.getAllByUserId(claim.id, query)
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/:application_id/stages',
  asyncMiddleware(async (req, res) => {
    const {
      params: { application_id },
      authInfo,
    } = req

    const response = await applicationController.getApplicationStages(
      application_id,
      authInfo,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/offer-letters',
  validateRequestQuery(offerLetterFiltersSchema),
  authorize(isOrganizationUser),
  asyncMiddleware(async (req, res) => {
    const { query, authInfo } = req
    const response = await applicationController.getOfferLetter(authInfo, query)
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/property-closings',
  authorize(requireOrganizationType(OrganizationType.HSF_INTERNAL)),
  asyncMiddleware(async (req, res) => {
    const { query } = req
    const response =
      await applicationController.getAllPropertyClosingsByHSF(query)
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get('/:application_id', async (req, res) => {
  const { authInfo, params } = req

  const response = await applicationController.getById(
    params.application_id,
    authInfo,
  )

  res.status(response.statusCode).json(response)
})

applicationRoutes.post(
  '/:application_id/offer-letter/request',
  requireRoles(Role.HOME_BUYER),
  asyncMiddleware(async (req, res) => {
    const { user: claim, params } = req
    const response = await applicationController.requestOfferLetter(
      params.application_id,
      claim.id,
    )
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/:application_id/offer-letter',
  requireRoles([Role.HOME_BUYER]),
  asyncMiddleware(async (req, res) => {
    const { user: claim, params } = req
    const response = await applicationController.getApplicationOfferLetter(
      params.application_id,
      claim.id,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.post(
  '/:application_id/closing/request',
  requireRoles(Role.HOME_BUYER),
  asyncMiddleware(async (req, res) => {
    const { user: claim, params } = req
    const response = await applicationController.requestPropertyClosing(
      params.application_id,
      claim.id,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.patch(
  '/:application_id/offer-letter/respond',
  authorize(
    All(
      isOrganizationUser,
      requireOrganizationType(
        OrganizationType.HSF_INTERNAL,
        OrganizationType.DEVELOPER_COMPANY,
      ),
    ),
  ),
  validateRequest(requestOfferLetterRespondSchema),
  asyncMiddleware(async (req, res) => {
    const { params, body, authInfo } = req
    const response = await applicationController.requestOfferLetterRespond(
      authInfo.currentOrganizationId,
      authInfo.userId,
      params.application_id,
      body,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.patch(
  '/:application_id/property-closings/respond',
  requireRoles(Role.SUPER_ADMIN),
  validateRequest(requestPropertyClosingSchema),
  asyncMiddleware(async (req, res) => {
    const { params, body } = req
    const response = await applicationController.propertyClosingRespond(
      params.application_id,
      body,
    )
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.post(
  '/:application_id/escrow/schedule',
  authorize(requireOrganizationType(OrganizationType.HSF_INTERNAL)),
  validateRequest(scheduleEscrowMeetingSchema),
  asyncMiddleware(async (req, res) => {
    const { params, body, authInfo } = req
    const response = await applicationController.scheduleEscrowMeeting(
      params.application_id,
      authInfo,
      body,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/:application_id/escrow-status',
  authorize(
    RequireAny(
      requireOrganizationType(
        OrganizationType.HSF_INTERNAL,
        OrganizationType.DEVELOPER_COMPANY,
      ),
      isHomeBuyer,
    ),
  ),
  asyncMiddleware(async (req, res) => {
    const { params, authInfo } = req
    const response = await applicationController.getEscrowMeetingStatus(
      params.application_id,
      authInfo,
    )
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.patch(
  '/:application_id/escrow-meeting/respond',
  authorize(
    RequireAny(
      requireOrganizationType(OrganizationType.DEVELOPER_COMPANY),
      isHomeBuyer,
    ),
  ),
  validateRequest(scheduleEscrowMeetingRespondSchema),
  asyncMiddleware(async (req, res) => {
    const { authInfo, body, params } = req
    const response = await applicationController.scheduleEscrowMeetingRespond(
      params.application_id,
      authInfo,
      body,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/mortgage/dips',
  authorize(
    requireOrganizationType(
      OrganizationType.DEVELOPER_COMPANY,
      OrganizationType.HSF_INTERNAL,
      OrganizationType.LENDER_INSTITUTION,
    ),
  ),
  validateRequest(dipFiltersSchema),
  asyncMiddleware(async (req, res) => {
    const { query, authInfo } = req

    const response = await applicationController.getDips(authInfo, query)
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/:application_id/mortgage/dips/:dip_id',
  authorize(
    requireOrganizationType(
      OrganizationType.DEVELOPER_COMPANY,
      OrganizationType.HSF_INTERNAL,
      OrganizationType.LENDER_INSTITUTION,
    ),
  ),
  asyncMiddleware(async (req, res) => {
    const { params } = req
    const { application_id, dip_id } = params
    const response = await applicationController.getApplicationDipById(
      application_id,
      dip_id,
    )
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.patch(
  '/:application_id/mortgage/dips/:dip_id',
  authorize(requireOrganizationType(OrganizationType.LENDER_INSTITUTION)),
  validateRequest(updateDipLoanSchema),
  asyncMiddleware(async (req, res) => {
    const { params, body } = req
    const { application_id, dip_id } = params
    const response = await applicationController.updateApplicationDipById(
      application_id,
      dip_id,
      body,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.patch(
  '/:application_id/mortgage/dips/lender/respond',
  authorize(requireOrganizationType(OrganizationType.LENDER_INSTITUTION)),
  validateRequest(lenderDipResponseSchema),
  asyncMiddleware(async (req, res) => {
    const { params, body } = req
    const { application_id } = params
    const response = await applicationController.lenderDipRespond(
      application_id,
      body.dip_id,
      body,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.patch(
  '/:application_id/mortgage/dips/user/respond',
  authorize(isHomeBuyer),
  validateRequest(userDipResponseSchema),
  asyncMiddleware(async (req, res) => {
    const { params, body, authInfo } = req
    const { application_id } = params
    const response = await applicationController.userDipRespond(
      authInfo,
      application_id,
      body.dip_id,
      body,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.put(
  '/:application_id/mortgage/dips/:dip_id',
  authorize(requireOrganizationType(OrganizationType.LENDER_INSTITUTION)),
  validateRequest(updateDipLoanSchema),
  asyncMiddleware(async (req, res) => {
    const { params, body } = req
    const { application_id, dip_id } = params
    const response = await applicationController.updateApplicationDipById(
      application_id,
      dip_id,
      body,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.post(
  '/:application_id/escrow/propose-reschedule',
  asyncMiddleware(async () => {}),
)

applicationRoutes.patch(
  '/:application_id/escrow/reschedule/:id/respond',
  asyncMiddleware(async () => {}),
)

applicationRoutes.post(
  '/:application_id/outright-payment/invoice',
  asyncMiddleware(async () => {}),
)

applicationRoutes.get(
  '/:application_id/outright-payment/invoices',
  asyncMiddleware(async () => {}),
)

applicationRoutes.get(
  '/:application_id/documents/required',
  validateRequestQuery(applicationDocFilterSchema),
  asyncMiddleware(async (req, res) => {
    const {
      authInfo,
      params: { application_id },
      query,
    } = req
    const response = await applicationController.getRequiredDoc(
      application_id,
      query,
      authInfo,
    )
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/:application_id/documents/groups',
  asyncMiddleware(async (req, res) => {
    const {
      authInfo,
      params: { application_id },
    } = req
    const response = await applicationController.getApplicationDocumentGroups(
      application_id,
      authInfo,
    )
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/:application_id/documents/filled',
  validateRequestQuery(applicationDocFilterSchema),
  asyncMiddleware(async (req, res) => {
    const {
      authInfo,
      params: { application_id },
      query,
    } = req
    const response = await applicationController.getFilledDocs(
      application_id,
      query,
      authInfo,
    )
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.patch(
  '/:application_id/documents/approval',
  validateRequest(applicationDocApprovalSchema),
  asyncMiddleware(async (req, res) => {
    const {
      body,
      authInfo,
      params: { application_id },
    } = req
    const response = await applicationController.documentApprovalRespond(
      application_id,
      body,
      authInfo,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.post(
  '/:application_id/documents',
  validateRequest(applicationDocUploadsSchema),
  asyncMiddleware(async (req, res) => {
    const {
      authInfo,
      params: { application_id },
      body,
    } = req

    const response = await applicationController.handleApplicationDocUploads(
      application_id,
      body,
      authInfo,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.post(
  '/:application_id/documents/hsf-complete-review',
  validateRequest(completeApplicationDocReviewSchema),
  asyncMiddleware(async (req, res) => {
    const {
      authInfo,
      params: { application_id },
      body,
    } = req
    const response = await applicationController.hsfCompleteDocumentReview(
      application_id,
      body,
      authInfo,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.post(
  '/:application_id/documents/lender-complete-review',
  validateRequest(completeApplicationDocReviewSchema),
  asyncMiddleware(async (req, res) => {
    const {
      authInfo,
      params: { application_id },
      body,
    } = req
    const response = await applicationController.lenderCompleteDocumentReview(
      application_id,
      body,
      authInfo,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/inspections/users/:user_id',
  validateRequestQuery(inspectionFiltersSchema),
  authorize(
    RequireAny(
      isHomeBuyer,
      requireOrganizationType(
        OrganizationType.DEVELOPER_COMPANY,
        OrganizationType.HSF_INTERNAL,
      ),
    ),
  ),
  asyncMiddleware(async (req, res) => {
    const { query, authInfo, params } = req
    const response = await applicationController.getInspections(authInfo, {
      ...query,
      user_id: params.user_id,
    })
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/:application_id/inspections',
  asyncMiddleware(async (req, res) => {
    const {
      params: { application_id },
      authInfo,
    } = req
    const response = await applicationController.getInspectionsByApplicationId(
      application_id,
      authInfo,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.post(
  '/:application_id/mortgage/payment/initiate',
  authorize(isHomeBuyer),
  validateRequest(initiateMortgagePaymentSchema),
  asyncMiddleware(async (req, res) => {
    const {
      authInfo,
      body,
      params: { application_id },
    } = req
    const response = await applicationController.initiateMortgagePaymentIntent(
      authInfo,
      application_id,
      body,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/:application_id/payments',
  authorize(
    RequireAny(
      isHomeBuyer,
      requireOrganizationType(OrganizationType.HSF_INTERNAL),
    ),
  ),

  validateRequestQuery(paymentFiltersSchema),
  asyncMiddleware(async (req, res) => {
    const {
      params: { application_id },
      authInfo,
      query,
    } = req
    const response = await applicationController.getApplicationPayments(
      authInfo,
      application_id,
      query,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.patch(
  '/:application_id/loan-offer/respond',
  authorize(isHomeBuyer),
  validateRequest(homeBuyerLoanOfferRespondSchema),
  asyncMiddleware(async (req, res) => {
    const {
      body,
      params: { application_id },
      authInfo,
    } = req
    const response = await applicationController.homeBuyerLoanOfferRespond(
      body,
      application_id,
      authInfo,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.patch(
  '/:application_id/loan-offer/submit-letter',
  authorize(isHomeBuyer),
  validateRequest(submitSignedLoanOfferLetterSchema),
  asyncMiddleware(async (req, res) => {
    const {
      body,
      params: { application_id },
      authInfo,
    } = req

    const response = await applicationController.submitSignedLoanOfferLetter(
      application_id,
      body,
      authInfo,
    )
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/:application_id/loans/active',
  asyncMiddleware(async (req, res) => {
    const {
      params: { application_id },
      authInfo,
    } = req

    const response = await applicationController.getActiveApplicationLoan(
      application_id,
      authInfo,
    )

    res.status(response.statusCode).json(response)
  }),
)

export default applicationRoutes
