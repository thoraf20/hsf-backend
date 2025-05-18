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
  isOrganizationUser,
  requireOrganizationType,
} from '@shared/utils/permission-policy'

import { ApplicationService } from '@use-cases/Application/application'
import {
  createApplicationSchema,
  offerLetterFiltersSchema,
  requestOfferLetterRespondSchema,
  scheduleEscrowMeetingRespondSchema,
  scheduleEscrowMeetingSchema,
} from '@validators/applicationValidator'
import {
  PropertyFilters,
  propertyFiltersSchema,
} from '@validators/propertyValidator'
import { Router } from 'express'
import { ReviewRequestRepository } from '@application/repositories/ReviewRequestRepository'
import { OrganizationRepository } from '@repositories/OrganizationRepository'

const applicationService = new ApplicationService(
  new ApplicationRepository(),
  new PropertyRepository(),
  new PrequalifyRepository(),
  new PropertyPurchaseRepository(),
  new UserRepository(),
  new OfferLetterRepository(),
  new ReviewRequestRepository(),
  new OrganizationRepository(),
)
const applicationController = new ApplicationController(applicationService)
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

applicationRoutes.get('/:application_id', async (req, res) => {
  const { authInfo, params } = req

  const response = await applicationController.getById(
    params.application_id,
    authInfo,
  )

  console.log(JSON.stringify(response.body))
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
  '/:application_id/closing/respond',
  requireRoles(Role.SUPER_ADMIN),
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
  validateRequest(scheduleEscrowMeetingSchema),
  asyncMiddleware(async (req, res) => {
    const { user: claim, params, body } = req
    const response = await applicationController.scheduleEscrowMeeting(
      params.application_id,
      claim.id,
      body,
    )

    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.patch(
  '/:application_id/escrow-meeting/respond',
  validateRequest(scheduleEscrowMeetingRespondSchema),
  asyncMiddleware(async (req, res) => {
    const { user: claim, body, params } = req
    const response = await applicationController.scheduleEscrowMeetingRespond(
      params.application_id,
      claim.id,
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

export default applicationRoutes
