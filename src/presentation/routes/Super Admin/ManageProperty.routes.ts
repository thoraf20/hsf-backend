import { PropertyRepository } from '@infrastructure/repositories/property/PropertyRepository'
import { manageProperty } from '@use-cases/Super Admin/ManageProperty'
import { Router } from 'express'
import { MangagePropertyController } from '@presentation/controllers/Admin/ManageProperty.controller'
import {
  asyncMiddleware,
  requireRoles,
  Role,
  validateRequest,
} from '../index.t'
import {
  approvePropertyClosingSchema,
  UpdatePropertyStatus,
} from '@application/requests/dto/propertyValidator'
import { PropertyPurchaseRepository } from '@repositories/property/PropertyPurchaseRepository'
import {
  approvePrequalifyRequestSchema,
  changeOfferLetterStatusSchema,
  confirmPropertyPurchase,
  SetEscrowMeetingSchema,
} from '@validators/adminValidator'
import { ApplicationRepository } from '@repositories/property/ApplicationRespository'

const managePropertyRoute: Router = Router()
const application = new ApplicationRepository()
const purchasrRepo = new PropertyPurchaseRepository()
const service = new manageProperty(
  new PropertyRepository(),
  purchasrRepo,
  application,
)
const controller = new MangagePropertyController(service, purchasrRepo)

managePropertyRoute.get(
  '/property/fetch',
  requireRoles([Role.SUPER_ADMIN, Role.ADMIN]),
  asyncMiddleware(async (req, res) => {
    const property = await controller.GetAllPropertiesToBeApproved()
    res.status(property.statusCode).json(property)
  }),
)
managePropertyRoute.post(
  '/property/set-escrow',
  requireRoles([Role.SUPER_ADMIN, Role.ADMIN]),
  validateRequest(SetEscrowMeetingSchema),
  asyncMiddleware(async (req, res) => {
    const { user, body } = req
    const property = await controller.setEscrowAttendance(body, user.id)
    res.status(property.statusCode).json(property)
  }),
)
managePropertyRoute.put(
  '/property/confirm-purchase',
  requireRoles([Role.SUPER_ADMIN, Role.ADMIN]),
  validateRequest(confirmPropertyPurchase),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const property = await controller.confirmPropertyPurchase(body)
    res.status(property.statusCode).json(property)
  }),
)
managePropertyRoute.put(
  '/property/approve-prequalifier',
  requireRoles([Role.SUPER_ADMIN, Role.ADMIN]),
  validateRequest(approvePrequalifyRequestSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const property = await controller.approvePrequalifyRequest(body)
    res.status(property.statusCode).json(property)
  }),
)
managePropertyRoute.put(
  '/property/grant-offer-letter',
  requireRoles(Role.DEVELOPER),
  validateRequest(changeOfferLetterStatusSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const property = await controller.changeOfferLetterStatus(body)
    res.status(property.statusCode).json(property)
  }),
)
managePropertyRoute.put(
  '/property/closing',
  requireRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  validateRequest(approvePropertyClosingSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const property = await controller.approvePropertyClosing(body)
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
