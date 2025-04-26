import { Router } from 'express'
import { InspectionRepository } from '@infrastructure/repositories/property/Inspection'
import { InspectionService } from '@application/useCases/Properties/Inspection'
import { InspectionController } from '@presentation/controllers/property/Inspection.controller'
import {
  asyncMiddleware,
  requireRoles,
  Role,
  validateRequest,
} from '../index.t'
import {
  inspectionSchema,
  UpdateInspectionStatusPayload,
  updateInspectionStatusSchema,
} from '@application/requests/dto/inspectionVaidator'
import { TransactionRepository } from '@infrastructure/repositories/transaction/TransactionRepository'

const inspectionRoutes: Router = Router()
const service = new InspectionService(
  new InspectionRepository(),
  new TransactionRepository(),
)

const inspectionController = new InspectionController(service)

inspectionRoutes.post(
  '/property/schedule',
  requireRoles(Role.HOME_BUYER),
  validateRequest(inspectionSchema),
  asyncMiddleware(async (req, res) => {
    const { user, body } = req
    const schedule = await inspectionController.scheduleInspectionController(
      body,
      user.id,
    )
    res.status(schedule.statusCode).json(schedule)
  }),
)

inspectionRoutes.patch(
  '/:inspection_id/status',
  requireRoles(Role.DEVELOPER),
  validateRequest(updateInspectionStatusSchema),
  asyncMiddleware(async (req, res) => {
    const { inspection_id } = req.params
    const body: UpdateInspectionStatusPayload = req.body
    const response = await inspectionController.updateScheduleInspectionStatus(
      inspection_id,
      body.status,
    )

    return res.status(response.statusCode).json(response)
  }),
)

inspectionRoutes.get(
  '/fetch-all',
  requireRoles(Role.HOME_BUYER),
  asyncMiddleware(async (req, res) => {
    const { user } = req
    const inspection = await inspectionController.getScheduleInspection(user.id)
    res.status(inspection.statusCode).json(inspection)
  }),
)
inspectionRoutes.get(
  '/developer/fetch-all',
  requireRoles(Role.DEVELOPER),
  asyncMiddleware(async (req, res) => {
    const { user } = req
    const inspection = await inspectionController.getDevScheduleInspection(
      user.id,
    )
    res.status(inspection.statusCode).json(inspection)
  }),
)

inspectionRoutes.get(
  '/single/:inspection_id',
  asyncMiddleware(async (req, res) => {
    const { params } = req
    const inspection = await inspectionController.getInspectionById(
      params.inspection_id,
    )
    res.status(inspection.statusCode).json(inspection)
  }),
)

export default inspectionRoutes
