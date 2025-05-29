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
  createApplicationSchema,
  dipFiltersSchema,
  lenderDipResponseSchema,
  offerLetterFiltersSchema,
  requestOfferLetterRespondSchema,
  requestPropertyClosingSchema,
  scheduleEscrowMeetingRespondSchema,
  scheduleEscrowMeetingSchema,
  updateDipLoanSchema,
} from '@validators/applicationValidator'
import {
  PropertyFilters,
  propertyFiltersSchema,
} from '@validators/propertyValidator'
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
      query as PropertyFilters,
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

    const response = await applicationController.getByHSF(
      query as PropertyFilters,
    )
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/user',
  validateRequestQuery(propertyFiltersSchema),
  requireRoles(Role.HOME_BUYER),
  asyncMiddleware(async (req, res) => {
    const { user: claim, query } = req

    const response = await applicationController.getAllByUserId(
      claim.id,
      query as PropertyFilters,
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
  asyncMiddleware(async (req, res, next) => {
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
  asyncMiddleware(async (req, res) => {
    const {
      authInfo,
      params: { application_id },
    } = req
    const response = await applicationController.getRequiredDoc(
      application_id,
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
export default applicationRoutes
