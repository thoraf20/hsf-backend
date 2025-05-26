import { ManageClientController } from '@controllers/Agent/ManageClient.controller'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { authorize } from '@middleware/authorization'
import { ManageClientRepository } from '@repositories/Agents/ManageClientRespository'
import { UserRepository } from '@repositories/user/UserRepository'
import { asyncMiddleware, validateRequest } from '@routes/index.t'
import { requireOrganizationType } from '@shared/utils/permission-policy'
import { ManageClientUseCase } from '@use-cases/Agent/ManageClient'
import {
  disableCustomerSchema,
  enableCustomerSchema,
} from '@validators/customerValidator'
import { Router } from 'express'

const manageClientRepository = new ManageClientRepository()
const useCase = new ManageClientUseCase(
  manageClientRepository,
  new UserRepository(),
)
const controller = new ManageClientController(useCase)
const clientRoutes: Router = Router()

clientRoutes.get(
  '/customers/fetch-all',
  authorize(requireOrganizationType(OrganizationType.HSF_INTERNAL)),
  asyncMiddleware(async (req, res) => {
    const { query } = req
    const response = await controller.getCustomers(query)
    res.status(response.statusCode).json(response)
  }),
)

clientRoutes.patch(
  '/customers/disable',
  authorize(requireOrganizationType(OrganizationType.HSF_INTERNAL)),
  validateRequest(disableCustomerSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const response = await controller.disableCustomer(body)
    res.status(response.statusCode).json(response)
  }),
)

clientRoutes.patch(
  '/customers/enable',
  authorize(requireOrganizationType(OrganizationType.HSF_INTERNAL)),
  validateRequest(enableCustomerSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const response = await controller.enableCustomer(body)
    res.status(response.statusCode).json(response)
  }),
)

clientRoutes.get(
  '/:user_id/metadata',
  asyncMiddleware(async (req, res) => {
    const { params } = req
    const response = await controller.getClientMetaData(params.user_id)
    res.status(response.statusCode).json(response)
  }),
)

export default clientRoutes
