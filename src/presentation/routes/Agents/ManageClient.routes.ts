import { ManageClientController } from '@controllers/Agent/ManageClient.controller'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { authorize } from '@middleware/authorization'
import { ManageClientRepository } from '@repositories/Agents/ManageClientRespository'
import { asyncMiddleware, Role } from '@routes/index.t'
import {
  All,
  requireOrganizationRole,
  requireOrganizationType,
} from '@shared/utils/permission-policy'
import { ManageClientUseCase } from '@use-cases/Agent/ManageClient'
import { Router } from 'express'

const manageClientRepository = new ManageClientRepository()
const useCase = new ManageClientUseCase(manageClientRepository)
const controller = new ManageClientController(useCase)
const clientRoutes: Router = Router()

clientRoutes.get(
  '/customers/fetch-all',
  authorize(
    All(
      requireOrganizationType(OrganizationType.HSF_INTERNAL),
      requireOrganizationRole([Role.HSF_ADMIN, Role.SUPER_ADMIN]),
    ),
  ),
  asyncMiddleware(async (req, res) => {
    console.log(req)
    const { query } = req
    const response = await controller.getCustomers(query)
    res.status(response.statusCode).json(response)
  }),
)

clientRoutes.get(
    '/:user_id/metadata',
    asyncMiddleware(async (req, res) => {
    const { params} = req
    const response = await controller.getClientMetaData(params.user_id)
    res.status(response.statusCode).json(response)
  }),
)

export default clientRoutes
