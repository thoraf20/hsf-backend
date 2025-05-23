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
  preQualifierStatusQuerySchema,
  preQualifiyRequestSchema,
} from '@validators/prequalifyValidation'
import { verifyOtpSchema } from '@validators/userValidator'
import { authorize } from '@middleware/authorization'
import { requireOrganizationType } from '@shared/utils/permission-policy'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { PropertyRepository } from '@repositories/property/PropertyRepository'
import { LenderRepository } from '@repositories/Agents/LenderRepository'
import { validateRequestQuery } from '@shared/utils/paginate'
import { OrganizationRepository } from '@repositories/OrganizationRepository'
import { DeveloperRespository } from '@repositories/Agents/DeveloperRepository'
import { UserRepository } from '@repositories/user/UserRepository'

const preQualifierRoutes: Router = Router()

const service = new preQualifyService(
  new PrequalifyRepository(),
  new PropertyRepository(),
  new LenderRepository(),
  new UserRepository(),
  new OrganizationRepository(),
  new DeveloperRespository(),
)
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
  validateRequest(preQualifiyRequestSchema),
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
    const { user, query } = req
    const prequalify = await controller.getPrequalifierByUserId(user.id, query)
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
  validateRequestQuery(preQualifierStatusQuerySchema),
  requireRoles(Role.HOME_BUYER),
  asyncMiddleware(async (req, res) => {
    const { user, query } = req
    const prequalify = await controller.getPrequalifierByUserId(user.id, query)
    res.status(prequalify.statusCode).json(prequalify)
  }),
)

preQualifierRoutes.patch(
  '/eligible',
  authorize(requireOrganizationType(OrganizationType.HSF_INTERNAL)),
  validateRequest(preQualifierEligibleSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const eligible = await controller.updatePrequalifierEligibility(body)
    res.status(eligible.statusCode).json(eligible)
  }),
)

export default preQualifierRoutes
