import { Router, Request, Response } from 'express'
import { asyncMiddleware, validateRequest } from '../index.t'
import { UserController } from '@presentation/controllers/User.controller'
import { UserService } from '@application/useCases/User/User'
import { UserRepository } from '@infrastructure/repositories/user/UserRepository'
import {
  updatePasswordSchema,
  updateProfileSchema,
  verifyTokenSchema,
} from '@application/requests/dto/userValidator'
import { AccountRepository } from '@repositories/user/AccountRepository'
const userRoutes: Router = Router()

const userServices = new UserService(new UserRepository())
const accountRepository = new AccountRepository()
const userController = new UserController(userServices, accountRepository)

userRoutes.put(
  '/update',
  validateRequest(updateProfileSchema),
  asyncMiddleware(async (req: Request, res: Response) => {
    const { body, user } = req
    const userUpdate = await userController.update(body, user.id)
    return res.status(userUpdate.statusCode).json(userUpdate)
  }),
)

userRoutes.get(
  '/profile',
  asyncMiddleware(async (req: Request, res: Response) => {
    const { user } = req
    const userProfile = await userController.getUserById(user.id)
    return res.status(userProfile.statusCode).json(userProfile)
  }),
)

userRoutes.post(
  '/verify-update',
  validateRequest(verifyTokenSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const userUpdate = await userController.verifyUpdate(body.token)
    res.status(userUpdate.statusCode).json(userUpdate)
  }),
)

userRoutes.put(
  '/change-password',
  validateRequest(updatePasswordSchema),
  asyncMiddleware(async (req, res) => {
    const { body, user } = req
    const updatePassword = await userController.resetPassword(body, user.id)
    res.status(updatePassword.statusCode).json(updatePassword)
  }),
)

export default userRoutes
