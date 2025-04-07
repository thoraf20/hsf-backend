import { PropertyRepository } from '@infrastructure/repositories/property/PropertyRepository'
import { manageProperty } from '@application/useCases/Admin/ManageProperty'
import { Router } from 'express'
import { MangagePropertyController } from '@presentation/controllers/Admin/ManageProperty.controller'
import {
  asyncMiddleware,
  requireRoles,
  Role,
  validateRequest,
} from '../index.t'
import { UpdatePropertyStatus } from '@application/requests/dto/propertyValidator'

const managePropertyRoute: Router = Router()

const service = new manageProperty(new PropertyRepository())
const controller = new MangagePropertyController(service)

managePropertyRoute.get(
  '/property/fetch',
  requireRoles([Role.SUPER_ADMIN, Role.ADMIN]),
  asyncMiddleware(async (req, res) => { 
    const property = await controller.GetAllPropertiesToBeApproved()
    res.status(property.statusCode).json(property)
  }),
)

managePropertyRoute.put(
  '/go-live/:property_id',
  requireRoles([Role.SUPER_ADMIN, Role.ADMIN]),
  validateRequest(UpdatePropertyStatus),
  asyncMiddleware(async (req, res) => {
    const { params, body } = req
    const property = await controller.ApprovedOrDisApproveProperty(
      params.property_id,
      body.status,
    )
    res.status(property.statusCode).json(property)
  }),
)

export default managePropertyRoute
