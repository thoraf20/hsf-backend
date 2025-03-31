import { Router } from 'express'
import { PropertyRepository } from '@infrastructure/repositories/property/PropertyRepository'
import { ManageDeveloper } from '@use-cases/Developer/developer'
import { DeveloperController } from '@controllers/Developer.controller'
import { requireRoles } from '@middleware/permissionMiddleware'
import { asyncMiddleware, Role } from '@routes/index.t'
import { InspectionRepository } from '@repositories/property/Inspection'
import { EnquiryRepository } from '@repositories/property/enquiries'
import { UserRepository } from '@repositories/user/UserRepository'

const developerRoutes: Router = Router()

const managePropertyservice = new ManageDeveloper(
  new PropertyRepository(),
  new InspectionRepository(),
  new EnquiryRepository(),
  new UserRepository(),
)

const controller = new DeveloperController(managePropertyservice)

developerRoutes.post(
  '/property/sold/:id',
  requireRoles([Role.DEVELOPER]),
  asyncMiddleware(async (req, res) => {
    const { user, params } = req
    const response = await controller.propertySold(user.id, params.id)
    res.status(response.statusCode).json(response)
  }),
)

developerRoutes.get(
  '/property/stats',
  requireRoles([Role.DEVELOPER]),
  asyncMiddleware(async (req, res) => {
    const { user } = req
    const response = await controller.allPropertyStats(user.id)
    res.status(response.statusCode).json(response)
  }),
)

developerRoutes.get(
  '/leads',
  requireRoles([Role.DEVELOPER]),
  asyncMiddleware(async (req, res) => {
    const { user, query } = req
    const response = await controller.getPropertyLeads(user.id, query)
    res.status(response.statusCode).json(response)
  }),
)

developerRoutes.get(
  '/leads/info',
  requireRoles([Role.DEVELOPER]),
  asyncMiddleware(async (req, res) => {
    const { user, query } = req
    const query_id = query.id as string
    const lead_type = query.lead_type as 'inspection' | 'enquiry'
    const response = await controller.getPropertyLeadInfo(
      user.id,
      query_id,
      lead_type,
    )
    res.status(response.statusCode).json(response)
  }),
)

export default developerRoutes
