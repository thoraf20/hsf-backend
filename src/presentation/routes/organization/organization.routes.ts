// HSF-Backend-New/src/presentation/routes/organization/organization.routes.ts
import express, { Request, Response } from 'express'
import { authorize } from '@middleware/authorization'
import { OrganizationController } from '@presentation/controllers/OrganizationController'
import {
  asyncMiddleware,
  authenticate,
  Role,
  validateRequest,
} from '@routes/index.t' // Import authenticate
// import { validateRequest } from '@middleware/validateRequest'
import {
  All,
  isOrganizationUser,
  requireOrganizationRole,
  requireOrganizationType,
} from '@shared/utils/permission-policy'
import { validateRequestQuery } from '@shared/utils/paginate'
import {
  createHsfAdminSchema,
  createLenderAdminSchema,
  getLenderFilterSchema,
  getOrgMemberRoleFilterSchema,
} from '@validators/organizationValidator'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { createDeveloperSchema } from '@validators/developerValidator'

const router = express.Router()
const organizationController = new OrganizationController()

router.get(
  '/hsf-admins',
  authorize(requireOrganizationType(OrganizationType.HSF_INTERNAL)),
  asyncMiddleware(async (req, res) => {
    const { query } = req
    const response = await organizationController.getAdmin(query)
    res.status(response.statusCode).json(response)
  }),
)

router.post(
  '/hsf-admins',
  validateRequest(createHsfAdminSchema),
  authorize(
    All(
      requireOrganizationType(OrganizationType.HSF_INTERNAL),
      requireOrganizationRole([Role.SUPER_ADMIN]),
    ),
  ),
  asyncMiddleware(async (req, res) => {
    const { body, authInfo } = req
    const response = await organizationController.createHsfAdmin(authInfo, body)

    res.status(response.statusCode).json(response)
  }),
)

router.post(
  '/hsf-subadmins',
  validateRequest(createHsfAdminSchema),
  authorize(
    All(
      requireOrganizationType(OrganizationType.HSF_INTERNAL),
      requireOrganizationRole([Role.HSF_ADMIN, Role.SUPER_ADMIN]),
    ),
  ),
  asyncMiddleware(async (req, res) => {
    const { body, authInfo } = req
    const response = await organizationController.createHsfSubAdmin(
      authInfo,
      body,
    )

    res.status(response.statusCode).json(response)
  }),
)

router.get(
  '/sub-admins',
  authorize(requireOrganizationType(OrganizationType.HSF_INTERNAL)),
  asyncMiddleware(async (req, res) => {
    const { query } = req
    const response = await organizationController.getSubAdmins(query)
    res.status(response.statusCode).json(response)
  }),
)

router.get(
  '/lenders',
  validateRequestQuery(getLenderFilterSchema),
  authorize(requireOrganizationType(OrganizationType.HSF_INTERNAL)),
  asyncMiddleware(async (req, res) => {
    const { query } = req
    const response = await organizationController.getLenders(query)
    res.status(response.statusCode).json(response)
  }),
)

router.post(
  '/lenders',
  validateRequest(createLenderAdminSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const response = await organizationController.createLender(body)
    res.status(response.statusCode).json(response)
  }),
)

router.post(
  '/developers',
  validateRequest(createDeveloperSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const response = await organizationController.createDeveloper(body)

    res.status(response.statusCode).json(response)
  }),
)

router.get(
  '/developers',
  authorize(requireOrganizationType(OrganizationType.HSF_INTERNAL)),
  asyncMiddleware(async (req, res) => {
    const { query } = req
    const response = await organizationController.getDevelopers(query)
    res.status(response.statusCode).json(response)
  }),
)

router.get(
  '/user',
  authenticate,
  authorize(isOrganizationUser),
  asyncMiddleware(async (req, res) => {
    const { user: claim } = req
    const response = await organizationController.getOrganizationsForUser(
      claim.id,
    )
    res.status(response.statusCode).json(response)
  }),
)

router.get(
  '/members',
  authenticate,
  authorize(isOrganizationUser),
  asyncMiddleware(async (req: Request, res: Response) => {
    const { authInfo, query } = req
    const response = await organizationController.getOrganizationMembers(
      authInfo.currentOrganizationId,
      query,
    )
    res.status(response.statusCode).json(response)
  }),
)

router.get(
  '/members/current-org-roles',
  validateRequestQuery(getOrgMemberRoleFilterSchema),
  authenticate,
  authorize(isOrganizationUser),
  asyncMiddleware(async (req, res) => {
    const { authInfo, query } = req
    const response = await organizationController.getCurrentOrgRoles(
      authInfo,
      query,
    )
    res.status(response.statusCode).json(response)
  }),
)

router.get(
  '/members/roles',
  validateRequestQuery(getOrgMemberRoleFilterSchema),
  authenticate,
  authorize(isOrganizationUser),
  asyncMiddleware(async (req, res) => {
    const { authInfo, query } = req
    const response = await organizationController.getCurrentOrgRoles(
      authInfo,
      query,
    )
    res.status(response.statusCode).json(response)
  }),
)

export default router
