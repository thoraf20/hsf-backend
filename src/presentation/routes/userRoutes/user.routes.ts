import { Router, Request, Response } from 'express'
import { asyncMiddleware, validateRequest } from '../index.t'
import { UserController } from '@presentation/controllers/User.controller'
import { UserService } from '@application/useCases/User/User'
import { UserRepository } from '@infrastructure/repositories/user/UserRepository'
import {
  changePasswordCompleteSchema,
  changeUserPasswordSchema,
  updatePasswordSchema,
  updateProfileImageSchema,
  updateProfileSchema,
  userActivityFilterSchema,
  verifyTokenSchema,
} from '@application/requests/dto/userValidator'
import { AccountRepository } from '@repositories/user/AccountRepository'
import { AddressController } from '@controllers/AddressController'
import { AddressService } from '@use-cases/User/Address'
import { AddressRepository } from '@repositories/user/AddressRepository'
import {
  createAddressSchema,
  updateAddressSchema,
} from '@validators/addressValidator'
import { validateRequestQuery } from '@shared/utils/paginate'
import { UserActivityLogRepository } from '@repositories/UserActivityLogRepository'
import { OrganizationRepository } from '@repositories/OrganizationRepository'
const userRoutes: Router = Router()

const userServices = new UserService(
  new UserRepository(),
  new UserActivityLogRepository(),
  new OrganizationRepository(),
)
const accountRepository = new AccountRepository()
const userController = new UserController(
  userServices,
  accountRepository,
  new AddressRepository(),
)
const addressController = new AddressController(
  new AddressService(new AddressRepository()),
)
userRoutes.patch(
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
  '/address',
  validateRequest(createAddressSchema),
  asyncMiddleware(async (req, res) => {
    const { user: claim, body } = req

    const response = await addressController.createByUser(claim.id, body)
    res.status(response.statusCode).json(response)
  }),
)

userRoutes.get(
  '/address',
  asyncMiddleware(async (req, res) => {
    const { user: claim } = req
    const response = await addressController.getByUser(claim.id)
    res.status(response.statusCode).json(response)
  }),
)

userRoutes.get(
  '/address/:address_id',
  asyncMiddleware(async (req, res) => {
    const { user: claim, params } = req

    const response = await addressController.getOneByUserId(
      params.address_id,
      claim.id,
    )
    res.status(response.statusCode).json(response)
  }),
)

userRoutes.put(
  '/address/:address_id',
  validateRequest(updateAddressSchema),
  asyncMiddleware(async (req, res) => {
    const { user: claim, body, params } = req

    const response = await addressController.updateByUser(
      params.address_id,
      claim.id,
      body,
    )
    res.status(response.statusCode).json(response)
  }),
)

userRoutes.delete(
  '/address/:address_id',
  asyncMiddleware(async (req, res) => {
    const { user: claim, params } = req
    const response = await addressController.deleteByUser(
      params.address_id,
      claim.id,
    )
    res.status(response.statusCode).json(response)
  }),
)

userRoutes.patch(
  '/profile/image',
  validateRequest(updateProfileImageSchema),
  asyncMiddleware(async (req, res) => {
    const { user: claim, body } = req
    const response = await userController.updateProfileImage(claim.id, body)
    res.status(response.statusCode).json(response)
  }),
)

userRoutes.post(
  '/password/initiate',
  validateRequest(changeUserPasswordSchema),
  asyncMiddleware(async (req, res) => {
    const { user: claim, body } = req
    const response = await userController.changeUserPassword(claim.id, body)
    res.status(response.statusCode).json(response)
  }),
)

userRoutes.post(
  '/password/complete',
  validateRequest(changePasswordCompleteSchema),
  asyncMiddleware(async (req, res) => {
    const { user: claim, body } = req
    const response = await userController.completeChangePassword(claim.id, body)
    res.status(response.statusCode).json(response)
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
    const updatePassword = await userController.changeUserPassword(
      user.id,
      body,
    )
    res.status(updatePassword.statusCode).json(updatePassword)
  }),
)

userRoutes.get(
  '/roles',
  validateRequestQuery(userActivityFilterSchema),
  asyncMiddleware(async (req, res) => {
    const response = await userController.getRoles()
    res.status(response.statusCode).json(response)
  }),
)

userRoutes.get(
  '/activities',
  asyncMiddleware(async (req, res) => {
    const { query, authInfo } = req
    const response = await userController.getUserActivites(
      {
        ...query,
        user_id: authInfo.userId,
      },
      authInfo,
    )

    res.status(response.statusCode).json(response)
  }),
)

export default userRoutes
