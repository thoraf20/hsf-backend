import { ManageInspectionController } from '@controllers/Developer/ManageInspection.controller'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { authorize } from '@middleware/authorization'
import { DeveloperRespository } from '@repositories/Agents/DeveloperRepository'
import { ManageInspectionRepository } from '@repositories/Developer/ManageInspectionsRespository'
import { OrganizationRepository } from '@repositories/OrganizationRepository'
import { ApplicationRepository } from '@repositories/property/ApplicationRespository'
import { InspectionRepository } from '@repositories/property/Inspection'
import { PropertyRepository } from '@repositories/property/PropertyRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import {
  asyncMiddleware,
  authenticate,
  Role,
  validateRequest,
} from '@routes/index.t'
import {
  requireOrganizationRole,
  requireOrganizationType,
} from '@shared/utils/permission-policy'
import { ManageInspectionUseCase } from '@use-cases/Developer/ManageInpections'
import {
  reschedule,
  SchduleTimeSchema,
  updateInspectionStatus,
} from '@validators/ManageInspectionValidator'
import { Router } from 'express'

const manageInpespectionRouter: Router = Router()
const manageInspectionRepository = new ManageInspectionRepository()
const organizationRepository = new OrganizationRepository()
const manageInpespectionUseCase = new ManageInspectionUseCase(
  manageInspectionRepository,
  organizationRepository,
  new ApplicationRepository(),
  new PropertyRepository(),
  new UserRepository(),
  new DeveloperRespository(),
  new InspectionRepository(),
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
    requireOrganizationType(
      OrganizationType.DEVELOPER_COMPANY,
      OrganizationType.HSF_INTERNAL,
    ),
    requireOrganizationRole([
      Role.DEVELOPER_ADMIN,
      Role.DEVELOPER_AGENT,
      Role.HSF_ADMIN,
      Role.HSF_INSPECTION_MANAGER,
      Role.SUPER_ADMIN,
    ]),
  ),
  asyncMiddleware(async (req, res) => {
    const { body, authInfo } = req
    const response =
      await manageInspectionController.createDayAvailabilityAndSlot(
        body,
        authInfo.currentOrganizationId,
      )
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

manageInpespectionRouter.put(
  '/:inspection_id/status',
  validateRequest(updateInspectionStatus),
  authenticate,
  authorize(
    requireOrganizationType(
      OrganizationType.DEVELOPER_COMPANY,
      OrganizationType.HSF_INTERNAL,
    ),
    requireOrganizationRole([
      Role.DEVELOPER_ADMIN,
      Role.DEVELOPER_AGENT,
      Role.HSF_ADMIN,
      Role.HSF_INSPECTION_MANAGER,
      Role.SUPER_ADMIN,
    ]),
  ),
  asyncMiddleware(async (req, res) => {
    const { params, authInfo, body } = req
    const response = await manageInspectionController.updateInspectionStatus(
      params.inspection_id,
      body.status,
      authInfo.currentOrganizationId,
    )
    res.status(response.statusCode).json(response)
  }),
)

manageInpespectionRouter.put(
  '/:inspection_id/propose-reschedule',
  validateRequest(reschedule),
  authenticate,
  authorize(
    requireOrganizationType(
      OrganizationType.DEVELOPER_COMPANY,
      OrganizationType.HSF_INTERNAL,
    ),
    requireOrganizationRole([
      Role.DEVELOPER_ADMIN,
      Role.DEVELOPER_AGENT,
      Role.HSF_ADMIN,
      Role.HSF_INSPECTION_MANAGER,
      Role.SUPER_ADMIN,
    ]),
  ),
  asyncMiddleware(async (req, res) => {
    const { params, authInfo, body } = req
    const response = await manageInspectionController.rescheduleInspection(
      body,
      params.inspection_id,
      authInfo.currentOrganizationId,
    )
    res.status(response.statusCode).json(response)
  }),
)

export default manageInpespectionRouter
