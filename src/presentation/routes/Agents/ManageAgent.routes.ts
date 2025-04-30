
import { Router } from 'express'
import {
  asyncMiddleware,
  requireRoles,
  Role,
} from '../index.t'
import { ManageAgents } from '@use-cases/Agent/ManageAgents'
import { ManageAgentRepository } from '@repositories/Agents/ManageAgentRepository'
import { ManageAgentController } from '@controllers/Agent/ManageAgents.controller'
import { UserRepository } from '@repositories/user/UserRepository'
const manageAgentRoutes: Router = Router()

const agents = new ManageAgentRepository()
const users = new UserRepository()
const manageAgent = new ManageAgents(agents, users)
const agentController = new ManageAgentController(manageAgent)

manageAgentRoutes.get('/agents/fetch-all', requireRoles([Role.ADMIN, Role.SUPER_ADMIN]), asyncMiddleware(async (req, res) => {
    const { query } = req
    const agents = await agentController.getAllAgents(query)
    res.status(agents.statusCode).json(agents)
}))
manageAgentRoutes.get('/single/agent/:agent_id', requireRoles([Role.ADMIN, Role.SUPER_ADMIN]), asyncMiddleware(async (req, res) => {
    const { params } = req
    const agents = await agentController.getAgentById(params.agent_id)
    res.status(agents.statusCode).json(agents)
}))


export default manageAgentRoutes