import { ApplicationController } from '@controllers/property/application.controller'
import { validateRequest } from '@middleware/validateRequest'
import { PrequalifyRepository } from '@repositories/prequalify/prequalifyRepository'
import { ApplicationRepository } from '@repositories/property/ApplicationRespository'
import { PropertyPurchaseRepository } from '@repositories/property/PropertyPurchaseRepository'
import { PropertyRepository } from '@repositories/property/PropertyRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { asyncMiddleware, requireRoles, Role } from '@routes/index.t'
import { PropertyFilters } from '@shared/types/repoTypes'
import { ApplicationService } from '@use-cases/Application/application'
import {
  createApplicationSchema,
  requestOfferLetterRespondSchema,
  scheduleEscrowMeetingRespondSchema,
  scheduleEscrowMeetingSchema,
} from '@validators/applicationValidator'
import { Router } from 'express'

const applicationService = new ApplicationService(
  new ApplicationRepository(),
  new PropertyRepository(),
  new PrequalifyRepository(),
  new PropertyPurchaseRepository(),
  new UserRepository(),
)
const applicationController = new ApplicationController(applicationService)
const applicationRoutes = Router()

applicationRoutes.post(
  '/',
  requireRoles(Role.HOME_BUYER),
  validateRequest(createApplicationSchema),
  asyncMiddleware(async (req, res) => {
    const { user: claim, body } = req
    const response = await applicationController.create(claim.id, body)
    res.status(response.statusCode).json(response)
  }),
)

applicationRoutes.get(
  '/user',
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
  '/:application_id/offer-letter',
  requireRoles(Role.SUPER_ADMIN),
  validateRequest(requestOfferLetterRespondSchema),
  asyncMiddleware(async (req, res) => {
    const { params, body } = req
    const response = await applicationController.requestOfferLetterRespond(
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

export default applicationRoutes
