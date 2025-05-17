import { Router } from 'express'
import { NotificationController } from '@presentation/controllers/NotificationController'
import { NotificationService } from '@application/useCases/Notification/NotificationService'
import { NotificationRepository } from '@infrastructure/repositories/notification/NotificationRepository'
import { UserRepository } from '@infrastructure/repositories/user/UserRepository'
import { asyncMiddleware, authenticate, validateRequest } from '@routes/index.t'
import { limiter } from '@middleware/security'
import {
  enabledNotificationTypeSchema,
  EnableNotificationMediumInput,
  enableNotificationMediumSchema,
  EnableNotificationTypeInput,
} from '@validators/notificationValidator'

const router = Router()

const notificationRepository = new NotificationRepository()
const userRepository = new UserRepository()
const notificationService = new NotificationService(
  notificationRepository,
  userRepository,
)
const notificationController = new NotificationController(notificationService)

router.get(
  '/types',
  asyncMiddleware(async (_, res) => {
    const response = await notificationController.getNotificationTypes()
    res.status(response.statusCode).json(response)
  }),
)

router.get(
  '/mediums',
  asyncMiddleware(async (_, res) => {
    const response = await notificationController.getNotificationMediums()
    res.status(response.statusCode).json(response)
  }),
)

router.get(
  '/frequencies',
  asyncMiddleware(async (_, res) => {
    const response = await notificationController.getFrequencies()
    res.status(response.statusCode).json(response)
  }),
)

router.get(
  '/user/mediums',
  authenticate,
  limiter,
  asyncMiddleware(async (req, res) => {
    const { user: claim } = req
    const response = await notificationController.getUserEnabledMediums(
      claim.id,
    )
    res.status(response.statusCode).json(response)
  }),
)

router.post(
  '/user/mediums',
  authenticate,
  limiter,
  validateRequest(enableNotificationMediumSchema),
  asyncMiddleware(async (req, res) => {
    const { user: claim } = req

    const { medium_id } = <EnableNotificationMediumInput>req.body
    const response = await notificationController.enableMediumForUser(
      claim.id,
      medium_id,
    )
    res.status(response.statusCode).json(response)
  }),
)

router.delete(
  '/user/mediums/:mediumId',
  authenticate,
  limiter,
  asyncMiddleware(async (req, res) => {
    const { user: claim } = req
    const mediumId = req.params.mediumId
    const response = await notificationController.disableMediumForUser(
      claim.id,
      mediumId,
    )
    res.status(response.statusCode).json(response)
  }),
)

router.get(
  '/user/types',
  authenticate,
  limiter,
  asyncMiddleware(async (req, res) => {
    const userId = req.user.id
    const response =
      await notificationController.getUserSubscribedNotificationTypes(userId)
    res.status(response.statusCode).json(response)
  }),
)

router.post(
  '/user/types',
  authenticate,
  limiter,
  validateRequest(enabledNotificationTypeSchema),
  asyncMiddleware(async (req, res) => {
    const userId = req.user.id
    const { type_id, frequency_id } = <EnableNotificationTypeInput>req.body
    const response =
      await notificationController.subscribeUserToNotificationType(
        userId,
        type_id,
        frequency_id !== undefined ? frequency_id : undefined,
      )
    res.status(response.statusCode).json(response)
  }),
)

router.delete(
  '/user/types/:typeId',
  authenticate,
  limiter,
  asyncMiddleware(async (req, res) => {
    const userId = req.user.id
    const typeId = req.params.typeId
    const response =
      await notificationController.unsubscribeUserFromNotificationType(
        userId,
        typeId,
      )
    res.status(response.statusCode).json(response)
  }),
)

export default router
