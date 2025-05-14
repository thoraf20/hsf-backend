// HSF-Backend-New/src/presentation/routes/organization/organization.routes.ts
import express, { Request, Response } from 'express'
import { authorize } from '@middleware/authorization'
import { Permission } from '@domain/enums/permissionEnum'
import { OrganizationController } from '@presentation/controllers/OrganizationController'
import { asyncMiddleware, authenticate } from '@routes/index.t' // Import authenticate
import { validateRequest } from '@middleware/validateRequest'
import { updateOrganizationSchema } from '@validators/organizationValidator'

const router = express.Router()
const organizationController = new OrganizationController()

router.get(
  '/user',
  authenticate, // Authenticate the user
  asyncMiddleware(async (req, res) => {
    const { user: claim } = req
    console.log({ claim })
    const response = await organizationController.getOrganizationsForUser(
      claim.id,
    )
    res.status(response.statusCode).json(response)
  }),
)

// GET a specific organization by ID
router.get(
  '/:id',
  authenticate, // Assuming authentication is required before authorization
  authorize(Permission.VIEW_ALL_ORGANIZATIONS), // Add specific permission check
  asyncMiddleware(async (req: Request, res: Response) => {
    const { params } = req

    const response = await organizationController.getOrganizationById(params.id)
    res.status(response.statusCode).json(response)
  }),
)

// PUT update an existing organization (requires admin privileges)
router.put(
  '/:id',
  authenticate, // Assuming authentication is required before authorization
  authorize(Permission.EDIT_ANY_ORGANIZATION), // Add specific permission check
  validateRequest(updateOrganizationSchema),
  asyncMiddleware(async (req: Request, res: Response) => {
    const { params, body } = req
    const response = await organizationController.updateOrganization(
      params.id,
      body,
    )

    res.status(response.statusCode).json(response)
  }),
)

// GET all members of a specific organization (Now includes pagination and detailed user/role info)
router.get(
  '/:id/members',
  authenticate, // Assuming authentication is required before authorization
  authorize(Permission.VIEW_ALL_ORGANIZATIONS), // Add specific permission check
  asyncMiddleware(async (req: Request, res: Response) => {
    const response = await organizationController.getOrganizationMembers(
      req,
      res,
    ) // Pass req and res
    res.status(response.statusCode).json(response)
  }),
)

export default router
