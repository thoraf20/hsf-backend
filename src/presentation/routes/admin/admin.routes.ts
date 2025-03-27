import { Router } from 'express'
import { UserRepository } from '../../../infrastructure/repositories/user/UserRepository'
import { asyncMiddleware, requireRole, Role, validateRequest } from '../index.t'
import { AgentsSchema } from '../../../application/requests/dto/adminValidator'
import { AdminController } from '../../../presentation/controllers/Admin.controller'
import { Admin } from '../../../application/useCases/Admin'

const adminRoute: Router = Router()

const userRepo = new UserRepository()
const service = new Admin(userRepo)
const controller = new AdminController(service)

adminRoute.post(
  '/invite',
  requireRole(Role.ADMIN),
  validateRequest(AgentsSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const user = await controller.inviteAgents(body)
    res.status(user.statusCode).json(user)
  }),
)

export default adminRoute
