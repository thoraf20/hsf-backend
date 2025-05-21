import { ManageInspectionController } from '@controllers/Developer/ManageInspection.controller'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { authorize } from '@middleware/authorization'
import { ManageInspectionRepository } from '@repositories/Developer/ManageInspectionsRespository'
import { OrganizationRepository } from '@repositories/OrganizationRepository'
import {
  requireOrganizationRole,
  requireOrganizationType,
} from '@shared/utils/permission-policy'
import { ManageInspectionUseCase } from '@use-cases/Developer/ManageInpections'
import { Router } from 'express'
import {
  asyncMiddleware,
  authenticate,
  Role,
  validateRequest,
} from '@routes/index.t'
import { SchduleTimeSchema } from '@validators/ManageInspectionValidator'
import { InspectionRepository } from '@repositories/property/Inspection'
const manageInpespectionRouter: Router = Router()
const manageInspectionRepository = new ManageInspectionRepository()
const organizationRepository = new OrganizationRepository()
const inspectionRepository = new InspectionRepository()
const manageInpespectionUseCase = new ManageInspectionUseCase(
  manageInspectionRepository,
  organizationRepository,
  inspectionRepository,
)
const manageInspectionController = new ManageInspectionController(
  manageInpespectionUseCase,
)

manageInpespectionRouter.get(
  '/:organization_id/list-inspections',
  authenticate,
  authorize(
    requireOrganizationType(OrganizationType.DEVELOPER_COMPANY),
    requireOrganizationRole([Role.DEVELOPER_ADMIN, Role.DEVELOPER_AGENT]),
  ),
  asyncMiddleware(async (req, res) => {
    const { organization_id } = req.params
    const query = req.query
    const response = await manageInspectionController.getInspectionList(
      organization_id,
      query,
    )
    res.status(response.statusCode).json(response)
  }),
)

manageInpespectionRouter.get(
  '/availability/fetch-all',
  authenticate,
  authorize(
    requireOrganizationType(OrganizationType.DEVELOPER_COMPANY),
    requireOrganizationRole([Role.DEVELOPER_ADMIN, Role.DEVELOPER_AGENT]),
  ),
  asyncMiddleware(async (req, res) => {
    const { authInfo } = req
    const response =
      await manageInspectionController.getOrganizationAvailability(
        authInfo.currentOrganizationId,
      )
    res.status(response.statusCode).json(response)
  }),
)

manageInpespectionRouter.post(
  '/availability',
  validateRequest(SchduleTimeSchema),
  authenticate,
  authorize(
    requireOrganizationType(OrganizationType.DEVELOPER_COMPANY, OrganizationType.HSF_INTERNAL),
    requireOrganizationRole([Role.DEVELOPER_ADMIN, Role.DEVELOPER_AGENT, Role.HSF_ADMIN, Role.HSF_INSPECTION_MANAGER, Role.SUPER_ADMIN]),
  ),
  asyncMiddleware(async (req, res) => {
    const {body, authInfo} = req
    const response =
      await manageInspectionController.createDayAvailabilityAndSlot(body, authInfo.currentOrganizationId)
    res.status(response.statusCode).json(response)
  }),
)

manageInpespectionRouter.get(
  '/single/:inspection_id',
  authorize(requireOrganizationType(OrganizationType.DEVELOPER_COMPANY)),
  asyncMiddleware(async (req, res) => {
    const { inspection_id } = req.params
    const response =
      await manageInspectionController.getInspectionById(inspection_id)
    res.status(response.statusCode).json(response)
  }),
)

manageInpespectionRouter.get(
  '/availability/:day_availablity_id',
  authorize(requireOrganizationType(OrganizationType.DEVELOPER_COMPANY)),
  asyncMiddleware(async (req, res) => {
    const { day_availablity_id } = req.params
    const response =
      await manageInspectionController.getDayAvailabilityById(
        day_availablity_id,
      )
    res.status(response.statusCode).json(response)
  }),
)

export default manageInpespectionRouter
