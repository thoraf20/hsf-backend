import { preQualifyController } from '@controllers/property/preQualify/prequalify.controller'
import { PrequalifyRepository } from '@repositories/prequalify/prequalifyRepository'
import { preQualifyService } from '@use-cases/Properties/preQualify/prequalify'
import { Router } from 'express'
import {
  asyncMiddleware,
  requireRoles,
  Role,
  validateRequest,
} from '@presentation/routes/index.t'
import {
  preQualifierEligibleSchema,
  preQualifierFiltersSchema,
  preQualifySchema,
} from '@validators/prequalifyValidation'
import { verifyOtpSchema } from '@validators/userValidator'
import { authorize } from '@middleware/authorization'
import { requireOrganizationType } from '@shared/utils/permission-policy'
import { OrganizationType } from '@domain/enums/organizationEnum'

const preQualifierRoutes: Router = Router()

const service = new preQualifyService(new PrequalifyRepository())
const controller = new preQualifyController(service)

preQualifierRoutes.get(
  '/',
  authorize(requireOrganizationType(OrganizationType.HSF_INTERNAL)),
  validateRequest(preQualifierFiltersSchema),
  asyncMiddleware(async (req, res) => {
    const { query } = req
    const response = await controller.getAllPreQualifiers(query)
    res.status(response.statusCode).json(response)
  }),
)

preQualifierRoutes.post(
  '/request',
  requireRoles(Role.HOME_BUYER),
  validateRequest(preQualifySchema),
  asyncMiddleware(async (req, res) => {
    const { user, body } = req
    const store = await controller.preQualifierController(body, user.id)
    res.status(store.statusCode).json(store)
  }),
)

preQualifierRoutes.post(
  '/verification',
  requireRoles(Role.HOME_BUYER),
  validateRequest(verifyOtpSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const verified = await controller.verification(body)
    res.status(verified.statusCode).json(verified)
  }),
)

preQualifierRoutes.get(
  '/home-buyer/single/fetch',
  requireRoles(Role.HOME_BUYER),
  asyncMiddleware(async (req, res) => {
    const { user } = req
    const prequalify = await controller.getPrequalifierByUserId(user.id)
    res.status(prequalify.statusCode).json(prequalify)
  }),
)

preQualifierRoutes.get(
  '/agents/fetch-all',
  requireRoles([Role.SUPER_ADMIN]),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const prequalify = await controller.verification(body)
    res.status(prequalify.statusCode).json(prequalify)
  }),
)
preQualifierRoutes.get(
  '/status',
  requireRoles(Role.HOME_BUYER),
  asyncMiddleware(async (req, res) => {
    const { user } = req
    const prequalify = await controller.getPrequalifierByUserId(user.id)
    res.status(prequalify.statusCode).json(prequalify)
  }),
)

preQualifierRoutes.patch(
  '/eligible',
  validateRequest(preQualifierEligibleSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const eligible = await controller.updatePrequalifierEligibility(body)
    res.status(eligible.statusCode).json(eligible)
  }),
)

export default preQualifierRoutes
