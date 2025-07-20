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
import { PrequalifyRepository } from '@repositories/prequalify/prequalifyRepository'
import { paymentRepository } from '@repositories/property/purchasePayment'
import { ApplicationRepository } from '@repositories/property/ApplicationRepository'
import { MortgageRepository } from '@repositories/property/MortgageRepository'
import { InspectionRepository } from '@repositories/property/Inspection'
import { ServiceOfferingRepository } from '@repositories/serviceOffering/serviceOfferingRepository'
const propertyPurchaseRoutes = Router()

const propertyRepository = new PropertyRepository()
const propertyPurchaseRepository = new PropertyPurchaseRepository()
const preQualifieRepository = new PrequalifyRepository()
const payment = new paymentRepository()
const application = new ApplicationRepository()
const MortgageRepositoryInj = new MortgageRepository()
const inspectionRepository = new InspectionRepository()
const serviceRepository = new ServiceOfferingRepository()
const propertyPurchaseService = new PropertyPurchase(
  propertyPurchaseRepository,
  propertyRepository,
  preQualifieRepository,
  payment,
  application,
  MortgageRepositoryInj,
  inspectionRepository,
  serviceRepository,
)
const purchasePropertyController = new PurchasePropertyController(
  propertyPurchaseService,
)

propertyPurchaseRoutes.post(
  '/',
  validateRequest(purchasePropertySchema),
  requireRoles(Role.HOME_BUYER),
  asyncMiddleware(async (req, res) => {
    const { user, body } = req
    const offerLetter = await purchasePropertyController.propertyPurchase(
      body,
      user.id,
    )
    res.status(offerLetter.statusCode).json(offerLetter)
  }),
)
propertyPurchaseRoutes.get(
  '/homebuyer/offer-letter',
  requireRoles(Role.HOME_BUYER),
  asyncMiddleware(async (req, res) => {
    const { user } = req
    const offerLetter = await purchasePropertyController.getOfferLetterByUserId(
      user.id,
    )
    res.status(offerLetter.statusCode).json(offerLetter)
  }),
)

propertyPurchaseRoutes.get(
  '/offer-letter/all',
  // requireRoles(Role.DEVELOPER),
  asyncMiddleware(async (req, res) => {
    const { user } = req
    const offerLetter = await purchasePropertyController.getOfferLetter(user.id)
    res.status(offerLetter.statusCode).json(offerLetter)
  }),
)

propertyPurchaseRoutes.get(
  '/single/offer-letter/:offer_letter_id',
  asyncMiddleware(async (req, res) => {
    const { params } = req
    const offerLetter = await purchasePropertyController.getOfferLetterById(
      params.offer_letter_id,
    )
    res.status(offerLetter.statusCode).json(offerLetter)
  }),
)

export default propertyPurchaseRoutes
