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
import { LenderRepository } from '@repositories/Agents/LeaderRepository'
import { AdminRepository } from '@repositories/Agents/AdminRepository'

const agentsRoute: Router = Router()

const developerRepo = new DeveloperRespository()
const userRepo = new UserRepository()
const lenderRepo = new LenderRepository()
const adminRepo = new AdminRepository()
const service = new Agents(userRepo, developerRepo, adminRepo, lenderRepo)
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
