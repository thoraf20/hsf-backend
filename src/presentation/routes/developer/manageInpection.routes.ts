import { ManageInspectionController } from '@controllers/Developer/ManageInspection.controller'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { authorize } from '@middleware/authorization'
import { DeveloperRespository } from '@repositories/Agents/DeveloperRepository'
import { ManageInspectionRepository } from '@repositories/Developer/ManageInspectionsRespository'
import { OrganizationRepository } from '@repositories/OrganizationRepository'
import { ApplicationRepository } from '@repositories/property/ApplicationRespository'
import { PropertyRepository } from '@repositories/property/PropertyRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { asyncMiddleware } from '@routes/index.t'
import { requireOrganizationType } from '@shared/utils/permission-policy'
import { ManageInspectionUseCase } from '@use-cases/Developer/ManageInpections'
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
)
const manageInspectionController = new ManageInspectionController(
  manageInpespectionUseCase,
)

manageInpespectionRouter.get(
  '/:organization_id/list-inspections',
  authorize(requireOrganizationType(OrganizationType.DEVELOPER_COMPANY)),
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
  '/inspection/single/:inspection_id',
  authorize(requireOrganizationType(OrganizationType.DEVELOPER_COMPANY)),
  asyncMiddleware(async (req, res) => {
    const { inspection_id } = req.params
    const response =
      await manageInspectionController.getInspectionById(inspection_id)
    res.status(response.statusCode).json(response)
  }),
)

export default manageInpespectionRouter
