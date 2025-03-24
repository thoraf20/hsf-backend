import { PropertyRepository } from '../../../infrastructure/repositories/property/PropertyRepository'
import { PropertyService } from '../../../application/useCases/Property'
import { Router } from 'express'
import { PropertyController } from '../../controllers/Property.controller'
import { asyncMiddleware, authenticate, isDevelopers, validateRequest } from '../index.t'
import { PropertySchema, UpdateSchema } from '../../../application/requests/dto/propertyValidator'

const propertyRoute: Router = Router()
const propertyRepo = new PropertyRepository()
const service = new PropertyService(propertyRepo)
const controller = new PropertyController(service)

propertyRoute.post(
  '/create',
  authenticate,
  isDevelopers,
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
  asyncMiddleware(async (req, res) => {
    const { user } = req
    const properties = await controller.getPropertyByUserId(user.id)
    res.status(properties.statusCode).json(properties)
  }),
)
propertyRoute.get(
  '/watchlist',
  authenticate,
  asyncMiddleware(async (req, res) => {
    const { user } = req
    console.log(user)
    const properties = await controller.getWatchlistProperty(user.id)
    res.status(properties.statusCode).json(properties)
  }),
)

propertyRoute.get(
  '/:id',
  asyncMiddleware(async (req, res) => {
    const { id } = req.params
    const property = await controller.getPropertyById(id)
    res.status(property.statusCode).json(property)
  }),
)

propertyRoute.put(
  '/update/:id',
  authenticate,
  isDevelopers,
  validateRequest(UpdateSchema),
  asyncMiddleware(async (req, res) => {
    const { body, params } = req
    const property = await controller.updateProperty(body, params.id)
    res.status(property.statusCode).json(property)
  }),
)

propertyRoute.delete(
  '/delete/:id',
  authenticate,
  isDevelopers,
  asyncMiddleware(async (req, res) => {
    const { id } = req.params
    const property = await controller.deleteProperty(id)
    res.status(property.statusCode).json(property)
  }),
)
propertyRoute.delete(
  '/remove-watchlist/:property_id',
  authenticate,
  asyncMiddleware(async (req, res) => {
    const { user, params } = req
    const property = await controller.removeFromWatchList(params.property_id, user.id)
    res.status(property.statusCode).json(property)
  }),
)


propertyRoute.delete(
  '/soft-delete/:id',
  authenticate,
  isDevelopers,
  asyncMiddleware(async (req, res) => {
    const { id } = req.params
    const property = await controller.softDeleteProperty(id)
    res.status(property.statusCode).json(property)
  }),
)


propertyRoute.post(
  '/add-watchlist/:property_id',
  authenticate,
  asyncMiddleware(async (req, res) => {
    const { user, params } = req
    const property = await controller.addWatchlistProperty(params.property_id, user.id)
    res.status(property.statusCode).json(property)
  }),
)






export default propertyRoute
