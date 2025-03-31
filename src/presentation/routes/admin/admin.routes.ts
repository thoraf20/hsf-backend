import { Router } from 'express'
import { UserRepository } from '@infrastructure/repositories/user/UserRepository'
import {
  asyncMiddleware,
  requireRoles,
  Role,
  validateRequest,
} from '../index.t'
import { AgentsSchema } from '@application/requests/dto/adminValidator'
import { AdminController } from '@controllers/Admin/Admin.controller'
import { Admin } from '@application/useCases/Admin/Admin'

const adminRoute: Router = Router()

const service = new Admin(new UserRepository())
const controller = new AdminController(service)

adminRoute.post(
  '/invite',
  requireRoles(Role.SUPER_ADMIN),
  validateRequest(AgentsSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const user = await controller.inviteAgents(body)
    res.status(user.statusCode).json(user)
  }),
)

export default adminRoute
