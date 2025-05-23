import { ServiceOfferingController } from '@controllers/Agent/ServiceOffering.controller'
import { User } from '@entities/User'
import { validateRequest } from '@middleware/validateRequest'
import { ServiceOfferingRepository } from '@repositories/serviceOffering/serviceOfferingRepository'
import { asyncMiddleware, requireRoles, Role } from '@routes/index.t'
import { ServiceOfferingFilters } from '@shared/types/repoTypes'
import { ServiceOfferingService } from '@use-cases/ServiceOffering/serviceOffering'
import {
  CreateServiceOfferingInput,
  createServiceOfferingSchema,
  UpdateServiceOfferingInput,
  updateServiceOfferingSchema,
} from '@validators/serviceOfferingValidator'
import { Router } from 'express'

const serviceOfferingRoutes = Router()
const serviceOfferingService = new ServiceOfferingService(
  new ServiceOfferingRepository(),
)
const controller = new ServiceOfferingController(serviceOfferingService)

serviceOfferingRoutes.post(
  '/',
  validateRequest(createServiceOfferingSchema),
  requireRoles(Role.SUPER_ADMIN),
  asyncMiddleware(async (req, res) => {
    const { body, user } = req as unknown as {
      body: CreateServiceOfferingInput
      user: User
    }

    const response = await controller.createServiceOffering(body, user.id)
    return res.status(response.statusCode).json(response)
  }),
)

serviceOfferingRoutes.put(
  '/:serviceOfferingId',
  validateRequest(updateServiceOfferingSchema),
  asyncMiddleware(async (req, res) => {
    const { serviceOfferingId } = req.params as unknown as {
      serviceOfferingId: string
    }

    const { body } = req as unknown as {
      body: UpdateServiceOfferingInput
    }

    const response = await controller.updateServiceOffering(
      serviceOfferingId,
      body,
    )
    return res.status(response.statusCode).json(response)
  }),
)

serviceOfferingRoutes.get(
  '/',
  // authorize(requireOrganizationType(OrganizationType.HSF_INTERNAL)),
  asyncMiddleware(async (req, res) => {
    const { query } = req as unknown as {
      query: ServiceOfferingFilters
    }

    const response = await controller.getAllServiceOfferings(query)
    return res.status(response.statusCode).json(response)
  }),
)

serviceOfferingRoutes.get(
  '/:serviceOfferingId',
  asyncMiddleware(async (req, res) => {
    const { serviceOfferingId } = req.params as unknown as {
      serviceOfferingId: string
    }

    const response = await controller.getServiceOfferingById(serviceOfferingId)
    return res.status(response.statusCode).json(response)
  }),
)

serviceOfferingRoutes.get(
  '/product-code/:productCode',
  asyncMiddleware(async (req, res) => {
    const { productCode } = req.params as unknown as {
      productCode: string
    }

    const response =
      await controller.getServiceOfferingByProductCode(productCode)
    return res.status(response.statusCode).json(response)
  }),
)

export default serviceOfferingRoutes
