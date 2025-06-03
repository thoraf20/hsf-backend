import { PropertyRepository } from '@infrastructure/repositories/property/PropertyRepository'
import { manageProperty } from '@use-cases/Agent/ManageProperty'
import { Router } from 'express'
import { MangagePropertyController } from '@controllers/Agent/ManageProperty.controller'
import {
  asyncMiddleware,
  requireRoles,
  Role,
  validateRequest,
} from '../index.t'
import {
  approvePropertyClosingSchema,
  setPropertyIsLiveStatus,
  setPropertyStatusSchema,
} from '@application/requests/dto/propertyValidator'
import { PropertyPurchaseRepository } from '@repositories/property/PropertyPurchaseRepository'
import {
  approvePrequalifyRequestSchema,
  confirmPropertyPurchase,
} from '@validators/agentsValidator'
import { ApplicationRepository } from '@repositories/property/ApplicationRespository'
import { authorize } from '@middleware/authorization'
import { requireOrganizationType } from '@shared/utils/permission-policy'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { DeveloperRespository } from '@repositories/Agents/DeveloperRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { UserActivityLogRepository } from '@repositories/UserActivityLogRepository'

const managePropertyRoute: Router = Router()
const application = new ApplicationRepository()
const purchasrRepo = new PropertyPurchaseRepository()
const service = new manageProperty(
  new PropertyRepository(),
  purchasrRepo,
  application,
  new DeveloperRespository(),
  new UserRepository(),
  new UserActivityLogRepository(),
)
const controller = new MangagePropertyController(service, purchasrRepo)

managePropertyRoute.get(
  '/property/fetch',
  requireRoles([Role.SUPER_ADMIN, Role.SUPER_ADMIN]),
  asyncMiddleware(async (req, res) => {
    const property = await controller.GetAllPropertiesToBeApproved()
    res.status(property.statusCode).json(property)
  }),
)

// managePropertyRoute.post(
//   '/property/set-escrow',
//   requireRoles([Role.SUPER_ADMIN]),
//   validateRequest(SetEscrowMeetingSchema),
//   asyncMiddleware(async (req, res) => {
//     const { user, body } = req
//     const property = await controller.setEscrowAttendance(body, user.id)
//     res.status(property.statusCode).json(property)
//   }),
// )
managePropertyRoute.put(
  '/property/confirm-purchase',
  requireRoles([Role.SUPER_ADMIN]),
  validateRequest(confirmPropertyPurchase),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const property = await controller.confirmPropertyPurchase(body)
    res.status(property.statusCode).json(property)
  }),
)
managePropertyRoute.put(
  '/property/approve-prequalifier',
  requireRoles([Role.SUPER_ADMIN]),
  validateRequest(approvePrequalifyRequestSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const property = await controller.approvePrequalifyRequest(body)
    res.status(property.statusCode).json(property)
  }),
)
// managePropertyRoute.put(
//   '/property/grant-offer-letter',
//   requireRoles(Role.DEVELOPER),
//   validateRequest(changeOfferLetterStatusSchema),
//   asyncMiddleware(async (req, res) => {
//     const { body } = req
//     const property = await controller.changeOfferLetterStatus(body)
//     res.status(property.statusCode).json(property)
//   }),
// )
managePropertyRoute.put(
  '/property/closing',
  requireRoles([Role.SUPER_ADMIN]),
  validateRequest(approvePropertyClosingSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const property = await controller.approvePropertyClosing(body)
    res.status(property.statusCode).json(property)
  }),
)

managePropertyRoute.patch(
  '/property/:property_id/go-live',
  authorize(
    requireOrganizationType(
      OrganizationType.HSF_INTERNAL,
      OrganizationType.DEVELOPER_COMPANY,
    ),
  ),
  validateRequest(setPropertyIsLiveStatus),
  asyncMiddleware(async (req, res) => {
    const { params, body, authInfo } = req
    const property = await controller.setPropertyGoLive(
      params.property_id,
      body,
      authInfo,
    )
    res.status(property.statusCode).json(property)
  }),
)

managePropertyRoute.patch(
  '/property/:property_id/status',
  authorize(requireOrganizationType(OrganizationType.HSF_INTERNAL)),
  validateRequest(setPropertyStatusSchema),
  asyncMiddleware(async (req, res) => {
    const { params, body, authInfo } = req
    const property = await controller.hsfPropertyApproval(
      params.property_id,
      body,
      authInfo,
    )
    res.status(property.statusCode).json(property)
  }),
)

managePropertyRoute.get(
  '/property/:property_id',
  authorize(
    requireOrganizationType(
      OrganizationType.HSF_INTERNAL,
      OrganizationType.DEVELOPER_COMPANY,
    ),
  ),

  asyncMiddleware(async (req, res) => {
    const { params, authInfo } = req
    const response = await controller.getPropertyById(
      params.property_id,
      authInfo,
    )
    res.status(response.statusCode).json(response)
  }),
)

export default managePropertyRoute
