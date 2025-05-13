import { requireRoles } from '@middleware/permissionMiddleware'
import { asyncMiddleware, Role } from '@routes/index.t'
import { Router } from 'express'

const manageApplicationRoutes = Router()

manageApplicationRoutes.get(
  '/applications',
  requireRoles([Role.DEVELOPER, Role.DEVELOPER]),
  asyncMiddleware(async () => {}),
)

export default manageApplicationRoutes
