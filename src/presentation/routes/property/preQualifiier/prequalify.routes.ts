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
import { preQualifySchema } from '@validators/prequalifyValidation'
import { verifyOtpSchema } from '@validators/userValidator'

const preQualifierRoutes: Router = Router()

const service = new preQualifyService(new PrequalifyRepository())
const controller = new preQualifyController(service)

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
  requireRoles([Role.ADMIN, Role.SUPER_ADMIN]),
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

export default preQualifierRoutes
