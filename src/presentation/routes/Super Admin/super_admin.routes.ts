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
import { Agents } from '@use-cases/Super Admin/agent'
import { DeveloperRespository } from '@repositories/Agents/DeveloperRepository'

const adminRoute: Router = Router()

const service = new Agents(new UserRepository(), new DeveloperRespository())
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
