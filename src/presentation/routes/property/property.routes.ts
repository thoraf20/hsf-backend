import { PropertyRepository } from '../../../infrastructure/repositories/property/PropertyRepository'
import { PropertyService } from '../../../application/useCases/Properties/Property'
import { Router } from 'express'
import { PropertyController } from '../../controllers/property/Property.controller'
import {
  asyncMiddleware,
  authenticate,
  requireRoles,
  Role,
  validateRequest,
} from '../index.t'
import {
  PropertySchema,
  UpdateSchema,
} from '../../../application/requests/dto/propertyValidator'
// import { limiter } from '../../../middleware/security'

const propertyRoute: Router = Router()
const service = new PropertyService(new PropertyRepository())
const controller = new PropertyController(service)

propertyRoute.post(
  '/create',
  authenticate,
  requireRoles(Role.DEVELOPER),
  // limiter,
  validateRequest(PropertySchema),
  asyncMiddleware(async (req, res) => {
    const { body, user } = req
    const property = await controller.createProperty(body, user.id)
    res.status(property.statusCode).json(property)
  }),
)

propertyRoute.get(
  '/all',
  asyncMiddleware(async (req, res) => {
    const properties = await controller.getAllProperties()
    res.status(properties.statusCode).json(properties)
  }),
)

propertyRoute.get(
  '/developer-properties',
  authenticate,
  requireRoles(Role.DEVELOPER),
  // limiter,
  asyncMiddleware(async (req, res) => {
    const { user, query } = req
    const properties = await controller.getPropertyByUserId(user.id, query);
    res.status(properties.statusCode).json(properties)
  }),
)
propertyRoute.get(
  '/watchlist',
  authenticate,
  requireRoles(Role.HOME_BUYER),
  // limiter,
  asyncMiddleware(async (req, res) => {
    const { user } = req
    console.log(user)
    console.log(user)
    const properties = await controller.getWatchlistProperty(user.id)
    res.status(properties.statusCode).json(properties)
  }),
)

propertyRoute.get(
  '/:id',
  // limiter,
  asyncMiddleware(async (req, res) => {
    const { id } = req.params
    const property = await controller.getPropertyById(id)
    res.status(property.statusCode).json(property)
  }),
)


propertyRoute.put(
  '/update/:id',
  authenticate,
  requireRoles(Role.DEVELOPER),
  // limiter,
  validateRequest(UpdateSchema),
  asyncMiddleware(async (req, res) => {
    const { body, params, user } = req
    const property = await controller.updateProperty(body, params.id, user.id)
    res.status(property.statusCode).json(property)
  }),
)

propertyRoute.delete(
  '/delete/:id',
  authenticate,
  requireRoles(Role.DEVELOPER),
  // limiter,
  asyncMiddleware(async (req, res) => {
    const { params, user } = req
    const property = await controller.deleteProperty(params.id, user.id)
    res.status(property.statusCode).json(property)
  }),
)
propertyRoute.delete(
  '/remove-watchlist/:property_id',
  authenticate,
  requireRoles(Role.HOME_BUYER),
  // limiter,
  asyncMiddleware(async (req, res) => {
    const { user, params } = req
    const property = await controller.removeFromWatchList(
      params.property_id,
      user.id,
    )
    res.status(property.statusCode).json(property)
  }),
)

propertyRoute.delete(
  '/soft-delete/:id',
  authenticate,
  requireRoles(Role.DEVELOPER),
  // limiter,
  asyncMiddleware(async (req, res) => {
    const { params, user } = req
    const property = await controller.softDeleteProperty(params.id, user.id)
    res.status(property.statusCode).json(property)
  }),
)

propertyRoute.post(
  '/add-watchlist/:property_id',
  authenticate,
  requireRoles(Role.HOME_BUYER),
  // limiter,
  asyncMiddleware(async (req, res) => {
    const { user, params } = req

    const property = await controller.addWatchlistProperty(
      params.property_id,
      user.id,
    )
    res.status(property.statusCode).json(property)
  }),
)


export default propertyRoute
