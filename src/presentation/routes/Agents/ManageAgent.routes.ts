import { Router } from 'express'
import { asyncMiddleware, requireRoles, Role } from '../index.t'
import { ManageAgents } from '@use-cases/Agent/ManageAgents'
import { ManageAgentRepository } from '@repositories/Agents/ManageAgentRepository'
import { ManageAgentController } from '@controllers/Agent/ManageAgents.controller'
import { UserRepository } from '@repositories/user/UserRepository'
import { OrganizationRepository } from '@repositories/OrganizationRepository'
import {
  All,
  requireOrganizationRole,
  requireOrganizationType,
} from '@shared/utils/permission-policy'
import { authorize } from '@middleware/authorization'
import { OrganizationType } from '@domain/enums/organizationEnum'
const manageAgentRoutes: Router = Router()

const agents = new ManageAgentRepository()
const users = new UserRepository()
const organization = new OrganizationRepository()
const manageAgent = new ManageAgents(agents, users, organization)
const agentController = new ManageAgentController(manageAgent)

manageAgentRoutes.get(
  '/agents/fetch-all',
  requireRoles([Role.SUPER_ADMIN]),
  asyncMiddleware(async (req, res) => {
    const { query } = req
    const agents = await agentController.getAllAgents(query)
    res.status(agents.statusCode).json(agents)
  }),
)
manageAgentRoutes.get(
  '/single/agent/:agent_id',
  requireRoles([Role.SUPER_ADMIN]),
  asyncMiddleware(async (req, res) => {
    const { params } = req
    const agents = await agentController.getAgentById(params.agent_id)
    res.status(agents.statusCode).json(agents)
  }),
)

manageAgentRoutes.put(
  '/reset-password/agent/:agent_id',
  authorize(
    All(
      requireOrganizationType(
        OrganizationType.DEVELOPER_COMPANY,
        OrganizationType.HSF_INTERNAL,
      ),
      requireOrganizationRole([
        Role.DEVELOPER_ADMIN,
        Role.HSF_ADMIN,
        Role.SUPER_ADMIN,
      ]),
    ),
  ),
  asyncMiddleware(async (req, res) => {
    const { authInfo, params } = req
    const resetPassword = await agentController.resetPasswordForOrganization(
      authInfo.currentOrganizationId,
      params.agent_id,
    )
    res.status(resetPassword.statusCode).json(resetPassword)
  }),
)

export default manageAgentRoutes
