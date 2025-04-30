import { Router } from 'express'
import { UserRepository } from '@infrastructure/repositories/user/UserRepository'
import {
  asyncMiddleware,
  requireRoles,
  Role,
  validateRequest,
} from '../index.t'
import {
  acceptInviteSchema,
  AdminSchema,
  AgentPasswordChangeSchema,
  DeveloperSchema,
  LenderSchema,
  SubAdminSchema,
} from '@validators/agentsValidator'
import { AgentsController } from '@controllers/Agent/Agent.controller'
import { Agents } from '@use-cases/Agent/Agent'
import { DeveloperRespository } from '@repositories/Agents/DeveloperRepository'
import { LenderRepository } from '@repositories/Agents/LeaderRepository'
import { AdminRepository } from '@repositories/Agents/AdminRepository'
import { optionalAuth } from '@middleware/authMiddleware'
import { DefaulPasswordAccess } from '@domain/enums/rolesEmun'

const agentsRoute: Router = Router()

const developerRepo = new DeveloperRespository()
const userRepo = new UserRepository()
const lenderRepo = new LenderRepository()
const adminRepo = new AdminRepository()
const service = new Agents(userRepo, developerRepo, adminRepo, lenderRepo)
const controller = new AgentsController(service)

// agentsRoute.post(
//   '/invite',
//   requireRoles(Role.SUPER_ADMIN),
//   validateRequest(AgentsSchema),
//   asyncMiddleware(async (req, res) => {
//     const { body } = req
//     const user = await controller.inviteAgents(body)
//     res.status(user.statusCode).json(user)
//   }),
// )
agentsRoute.post(
  '/invite-admin',
  requireRoles([Role.SUPER_ADMIN, Role.ADMIN]),
  validateRequest(AdminSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const user = await controller.inviteAdmin(body, req.user.id)
    res.status(user.statusCode).json(user)
  }),
)
agentsRoute.post(
  '/invite-sub-admin',
  requireRoles([Role.SUPER_ADMIN, Role.ADMIN]),
  validateRequest(SubAdminSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const user = await controller.inviteSubAdmin(body, req.user.id)
    res.status(user.statusCode).json(user)
  }),
)
agentsRoute.post(
  '/invite-developer',
  requireRoles([Role.SUPER_ADMIN, Role.ADMIN]),
  validateRequest(DeveloperSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const user = await controller.inviteDeveloper(body, req.user.id)
    res.status(user.statusCode).json(user)
  }),
)
agentsRoute.post(
  '/invite-lender',
  requireRoles([Role.SUPER_ADMIN, Role.ADMIN]),
  validateRequest(LenderSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const user = await controller.inviteLender(body, req.user.id)
    res.status(user.statusCode).json(user)
  }),
)
agentsRoute.post(
  '/accept-invite',
  optionalAuth,
  validateRequest(acceptInviteSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const user = await controller.acceptInvite(body)
    res.status(user.statusCode).json(user)
  }),
)

agentsRoute.put(
  '/change-default-password',
  //@ts-ignore
  requireRoles([...Object.values(DefaulPasswordAccess)]),
  validateRequest(AgentPasswordChangeSchema),
  asyncMiddleware(async (req, res) => {
    const { body, user } = req as any

    const agent = await controller.changeInvitationDefaultPassword(
      body,
      user.id,
    )
    res.status(agent.statusCode).json(agent)
  }),
)

export default agentsRoute
