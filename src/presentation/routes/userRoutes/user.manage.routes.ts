import { UserController } from '@controllers/User.controller'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { authorize } from '@middleware/authorization'
import { AccountRepository } from '@repositories/user/AccountRepository'
import { AddressRepository } from '@repositories/user/AddressRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { asyncMiddleware } from '@routes/index.t'
import { validateRequestQuery } from '@shared/utils/paginate'
import { requireOrganizationType } from '@shared/utils/permission-policy'
import { UserService } from '@use-cases/User/User'
import { getUserFiltersSchema } from '@validators/userValidator'
import { Router } from 'express'

const manageUserRoutes = Router()
const userServices = new UserService(new UserRepository())
const accountRepository = new AccountRepository()
const addressRepository = new AddressRepository()
const userController = new UserController(
  userServices,
  accountRepository,
  addressRepository,
)

manageUserRoutes.get(
  '/users',
  validateRequestQuery(getUserFiltersSchema),
  authorize(requireOrganizationType(OrganizationType.HSF_INTERNAL)),
  asyncMiddleware(async (req, res) => {
    const { query } = req
    const response = await userController.getUsers(query)
    res.status(response.statusCode).json(response)
  }),
)

manageUserRoutes.get(
  '/users/:user_id',
  authorize(requireOrganizationType(OrganizationType.HSF_INTERNAL)),
  asyncMiddleware(async (req, res) => {
    const {
      params: { user_id },
    } = req

    const response = await userController.getUserById(user_id)
    res.status(response.statusCode).json(response)
  }),
)

export default manageUserRoutes
