import { Router } from 'express'
import { PropertyPurchase } from '@use-cases/Properties/propertyPurchase'
import { PropertyRepository } from '@infrastructure/repositories/property/PropertyRepository'
import { PropertyPurchaseRepository } from '@repositories/property/PropertyPurchaseRepository'
import { PurchasePropertyController } from '@controllers/property/PropertyPurchase.controller'
import {
    asyncMiddleware,
    requireRoles,
    Role,
    validateRequest,
  } from '../index.t'
import { purchasePropertySchema } from '@validators/purchaseValidation'
const propertyPurchaseRoutes = Router()

const propertyRepository = new PropertyRepository()
const propertyPurchaseRepository = new PropertyPurchaseRepository()
const propertyPurchaseService = new PropertyPurchase(propertyPurchaseRepository, propertyRepository)
const purchasePropertyController = new PurchasePropertyController(propertyPurchaseService)

propertyPurchaseRoutes.post('/request-for-offer-letter', validateRequest(purchasePropertySchema), requireRoles(Role.HOME_BUYER), asyncMiddleware(async( req, res) => {
         const {user, body} = req 
         const offerLetter = await purchasePropertyController.requestOfferLetter(body, user.id)
         res.status(offerLetter.statusCode).json(offerLetter)
}))

export default propertyPurchaseRoutes
