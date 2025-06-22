import { UserAssignmentController } from '@controllers/UserAssignmentController'
import { UserAssignmentRepository } from '@repositories/user/UserAssignmentRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { asyncMiddleware } from '@routes/index.t'
import { UserAssignmentService } from '@use-cases/User/UserAssignment'
import { Router } from 'express'

const userAssignmentRoutes = Router()

const userAssignmentRepository = new UserAssignmentRepository()
const userRepository = new UserRepository()
const userAssignmentService = new UserAssignmentService(
  userAssignmentRepository,
  userRepository,
)

const userAssignmentController = new UserAssignmentController(
  userAssignmentService,
)

userAssignmentRoutes.get(
  '/:id',
  asyncMiddleware(async (req, res) => {
    const {
      params: { id },
    } = req
    const response = await userAssignmentController.getAssignmentById(id)

    res.status(response.statusCode).json(response)
  }),
)

// router.get(
//   '/by-assignable/:assignableId/:assignableType',
//   validate(UserAssignmentFiltersSchema, 'query'), // Validate query parameters
//   (req, res) => userAssignmentController.getAssignmentsByAssignable(req, res),
// )

// router.get(
//   '/by-user/:userId',
//   validate(UserAssignmentFiltersSchema, 'query'),
//   (req, res) => userAssignmentController.getAssignmentsByUser(req, res),
// )

// router.get(
//     '/current/:assignableId/:assignableType',
//     validate(UserAssignmentFiltersSchema, 'query'), // Role can be in query
//     (req, res) => userAssignmentController.getCurrentAssignment(req, res),
// );

export default userAssignmentRoutes
