import { Router } from 'express'
import { UserRepository } from '@infrastructure/repositories/user/UserRepository'
import {
  asyncMiddleware,
  requireRoles,
  Role,
  validateRequest,
} from '../index.t'
import { AgentsSchema } from '@application/requests/dto/adminValidator'
import { AgentsController } from '@controllers/Super Admin/Agent.controller'
import { Agents } from '@use-cases/Super Admin/agent'
import { DeveloperRespository } from '@repositories/Agents/DeveloperRepository'

const agentsRoute: Router = Router()

const service = new Agents(new UserRepository(), new DeveloperRespository())
const controller = new AgentsController(service)

agentsRoute.post(
  '/invite',
  requireRoles(Role.SUPER_ADMIN),
  validateRequest(AgentsSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const user = await controller.inviteAgents(body)
    res.status(user.statusCode).json(user)
  }),
)

export default agentsRoute
