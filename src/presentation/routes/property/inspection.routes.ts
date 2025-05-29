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
  reponseToReschedule,
  UpdateInspectionStatusPayload,
  updateInspectionStatusSchema,
} from '@application/requests/dto/inspectionVaidator'
import { TransactionRepository } from '@infrastructure/repositories/transaction/TransactionRepository'
import { ServiceOfferingRepository } from '@repositories/serviceOffering/serviceOfferingRepository'
import { authorize } from '@middleware/authorization'
import { isHomeBuyer } from '@shared/utils/permission-policy'
import { ManageInspectionRepository } from '@repositories/Developer/ManageInspectionsRespository'
import { PropertyRepository } from '@repositories/property/PropertyRepository'
import { OrganizationRepository } from '@repositories/OrganizationRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { ManageInspectionUseCase } from '@use-cases/Developer/ManageInpections'
import { ApplicationRepository } from '@repositories/property/ApplicationRespository'
import { DeveloperRespository } from '@repositories/Agents/DeveloperRepository'

const inspectionRoutes: Router = Router()

const manageInspectionService = new ManageInspectionUseCase(
  new ManageInspectionRepository(),
  new OrganizationRepository(),
  new ApplicationRepository(),
  new PropertyRepository(),
  new UserRepository(),
  new DeveloperRespository(),
  new InspectionRepository(),
)

const service = new InspectionService(
  new InspectionRepository(),
  new ServiceOfferingRepository(),
  new TransactionRepository(),
  new ManageInspectionRepository(),
  new PropertyRepository(),
  new OrganizationRepository(),
  new UserRepository(),
  manageInspectionService,
)

const inspectionController = new InspectionController(service)

inspectionRoutes.post(
  '/property/schedule',
  authorize(isHomeBuyer),
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
  '/reschedule/:inspection_id/respond',
  requireRoles(Role.HOME_BUYER),
  validateRequest(reponseToReschedule),
  asyncMiddleware(async (req, res) => {
    const { body, params } = req
    const schedule = await inspectionController.responseToReschedule(
      params.inspection_id,
      body,
    )
    res.status(schedule.statusCode).json(schedule)
  }),
)

inspectionRoutes.patch(
  '/:inspection_id/status',
  // requireRoles(Role.DEVELOPER),
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
