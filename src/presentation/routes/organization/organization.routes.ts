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
  Not,
  requireOrganizationRole,
  requireOrganizationType,
  requireRoleLevel,
} from '@shared/utils/permission-policy'
import { validateRequestQuery } from '@shared/utils/paginate'
import {
  createEmployeeSchema,
  createHsfAdminSchema,
  createLenderAdminSchema,
  getLenderFilterSchema,
  getOrgMemberFilterSchema,
  getOrgMemberRoleFilterSchema,
  hsfResetOrgMemberPasswordSchema,
  resetOrgMemberPasswordSchema,
  suspendOrgSchema,
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

router.get(
  '/lenders/:lender_id',
  validateRequestQuery(getLenderFilterSchema),
  authorize(
    requireOrganizationType(
      OrganizationType.HSF_INTERNAL,
      OrganizationType.LENDER_INSTITUTION,
      OrganizationType.DEVELOPER_COMPANY,
    ),
  ),
  asyncMiddleware(async (req, res) => {
    const {
      params: { lender_id },
    } = req
    const response = await organizationController.getLenderByID(lender_id)
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
  '/developers/required-docs',
  authorize(
    requireOrganizationType(
      OrganizationType.HSF_INTERNAL,
      OrganizationType.DEVELOPER_COMPANY,
    ),
  ),
  asyncMiddleware(async (_, res) => {
    const response = await organizationController.getDeveloperRegRequiredDoc()
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
      authInfo,
    )
    res.status(response.statusCode).json(response)
  }),
)

router.post(
  '/members',
  authenticate,
  authorize(Not(requireOrganizationType(OrganizationType.HSF_INTERNAL))),
  validateRequest(createEmployeeSchema),
  asyncMiddleware(async (req, res) => {
    const { authInfo, body } = req
    const response = await organizationController.createEmployee(authInfo, body)
    res.status(response.statusCode).json(response)
  }),
)

router.get(
  '/:organization_id/members',
  authenticate,
  validateRequestQuery(getOrgMemberFilterSchema),
  asyncMiddleware(async (req: Request, res: Response) => {
    const {
      params: { organization_id },
      query,
      authInfo,
    } = req
    const response = await organizationController.getOrganizationMembers(
      organization_id,
      query,
      authInfo,
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
  '/:organization_id/members/roles',
  validateRequestQuery(getOrgMemberRoleFilterSchema),
  authenticate,
  authorize(isOrganizationUser),
  asyncMiddleware(async (req, res) => {
    const {
      params: { organization_id },
      query,
    } = req
    const response = await organizationController.getOrgRoles(
      organization_id,
      query,
    )
    res.status(response.statusCode).json(response)
  }),
)

router.patch(
  '/member/reset-password',
  authorize(All(isOrganizationUser, requireRoleLevel(1))),
  validateRequest(resetOrgMemberPasswordSchema),
  asyncMiddleware(async (req, res) => {
    const {
      authInfo,
      body: { member_id },
    } = req
    const response = await organizationController.resetOrgMemberPassword(
      authInfo,
      member_id,
    )

    res.status(response.statusCode).json(response)
  }),
)

router.patch(
  '/members/:member_id/disable-2fa',
  authorize(All(isOrganizationUser, requireRoleLevel(1))),
  asyncMiddleware(async (req, res) => {
    const { authInfo, body } = req
    const response = await organizationController.disableOrgMember2fa(
      authInfo,
      body,
    )

    res.status(response.statusCode).json(response)
  }),
)

router.patch(
  `/reset-password`,
  authorize(
    All(
      requireOrganizationType(OrganizationType.HSF_INTERNAL),
      requireOrganizationRole([Role.SUPER_ADMIN, Role.HSF_ADMIN]),
    ),
  ),
  validateRequest(hsfResetOrgMemberPasswordSchema),
  asyncMiddleware(async (req, res) => {
    const { authInfo, body } = req

    const response = await organizationController.hsfResetOrgMemberPassword(
      authInfo,
      body,
    )

    res.status(response.statusCode).json(response)
  }),
)

router.patch(
  '/:id/activate',
  authenticate,
  asyncMiddleware(async (req, res) => {
    const response = await organizationController.activateOrganization(
      req.params.id,
    )
    res.status(response.statusCode).json(response)
  }),
)

router.patch(
  '/:id/suspend',
  authorize(
    All(
      requireOrganizationType(OrganizationType.HSF_INTERNAL),
      requireOrganizationRole([Role.HSF_ADMIN, Role.SUPER_ADMIN]),
    ),
  ),
  validateRequest(suspendOrgSchema),
  async (req, res) => {
    const {
      params: { id },
      body,
    } = req
    const response = await organizationController.suspendOrganization(id, body)
    res.status(response.statusCode).json(response)
  },
)

router.delete(
  '/:id',
  authorize(
    All(
      requireOrganizationType(OrganizationType.HSF_INTERNAL),
      requireOrganizationRole([Role.HSF_ADMIN, Role.SUPER_ADMIN]),
    ),
  ),
  async (req, res) => {
    const response = await organizationController.deleteOrganization(
      req.params.id,
    )
    res.status(response.statusCode).json(response)
  },
)

router.get(
  '/developers/:developer_id',
  authorize(requireOrganizationType(OrganizationType.HSF_INTERNAL)),
  asyncMiddleware(async (req, res) => {
    const {
      params: { developer_id },
    } = req
    const response =
      await organizationController.getDeveloperByDeveloperId(developer_id)
    res.status(response.statusCode).json(response)
  }),
)

export default router
