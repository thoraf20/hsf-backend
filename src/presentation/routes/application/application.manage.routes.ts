import { InspectionController } from '@controllers/property/Inspection.controller'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { authorize } from '@middleware/authorization'
import { DeveloperRespository } from '@repositories/Agents/DeveloperRepository'
import { ManageInspectionRepository } from '@repositories/Developer/ManageInspectionsRespository'
import { OrganizationRepository } from '@repositories/OrganizationRepository'
import { ApplicationRepository } from '@repositories/property/ApplicationRespository'
import { InspectionRepository } from '@repositories/property/Inspection'
import { PropertyRepository } from '@repositories/property/PropertyRepository'
import { ServiceOfferingRepository } from '@repositories/serviceOffering/serviceOfferingRepository'
import { TransactionRepository } from '@repositories/transaction/TransactionRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { asyncMiddleware } from '@routes/index.t'
import { validateRequestQuery } from '@shared/utils/paginate'
import { requireOrganizationType } from '@shared/utils/permission-policy'
import { ManageInspectionUseCase } from '@use-cases/Developer/ManageInpections'
import { InspectionService } from '@use-cases/Properties/Inspection'
import { inspectionFiltersSchema } from '@validators/inspectionVaidator'
import { Router } from 'express'

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

const manageInspectionRoutes = Router()

manageInspectionRoutes.get(
  '/inspections',
  authorize(
    requireOrganizationType(
      OrganizationType.HSF_INTERNAL,
      OrganizationType.DEVELOPER_COMPANY,
    ),
  ),
  validateRequestQuery(inspectionFiltersSchema),
  asyncMiddleware(async (req, res) => {
    const { query } = req
    const response = await inspectionController.getAllInspection(query)
    res.status(response.statusCode).json(response)
  }),
)

export default manageInspectionRoutes
