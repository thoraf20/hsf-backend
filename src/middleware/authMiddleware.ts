import db from '@infrastructure/database/knex'
import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import { AuthInfo } from '../shared/utils/permission-policy' // Adjust path if needed
import { Role } from '../domain/enums/rolesEmun'
import { asyncMiddleware } from '@routes/index.t'
import { ApplicationCustomError } from './errors/customError'
import { UserOrganizationMember } from '@entities/UserOrganizationMember'
import { OrganizationType } from '@domain/enums/organizationEnum'

interface AuthRequest extends Request {
  authInfo?: AuthInfo
  currentOrganizationId?: string // Allows setting current org ID on request
}

const authenticate = asyncMiddleware(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      throw new ApplicationCustomError(
        StatusCodes.UNAUTHORIZED,
        'Access denied. No token provided.',
      )
    }

    try {
      const secret = process.env.SECRET_TOKEN! as string
      const decoded = jwt.verify(token, secret) as { id: string } // Assuming decoded JWT has user id

      const userId = decoded.id

      // 1. Fetch User from users table (including global role_id)
      const userRecord = await db('users')
        .where({ id: userId })
        .select('id', 'role_id') // Select necessary fields
        .first()

      if (!userRecord) {
        throw new ApplicationCustomError(
          StatusCodes.UNAUTHORIZED,
          'Unauthorized Request. User not found.',
        )
      }

      // 2. Fetch user's global role name
      let globalRole: Role | undefined
      if (userRecord.role_id) {
        const globalRoleRecord = await db('roles')
          .where({ id: userRecord.role_id })
          .select('name')
          .first()
        globalRole = globalRoleRecord?.name as Role | undefined
      }

      // 3. Fetch user's organization memberships
      const organizationMembership = await db<UserOrganizationMember>(
        'user_organization_memberships as uom',
      )
        .where({ user_id: userId })
        .leftJoin('organizations as o', 'o.id', 'uom.organization_id')
        .select<{
          organization_id: string
          role_id: string
          type: OrganizationType
        }>('uom.organization_id', 'uom.role_id', 'o.type')
        .first() // Select organization_id and role_id

      // 4. Construct AuthInfo object.  Only include the first membership.
      let authInfo: AuthInfo = {
        userId: userRecord.id,
        globalRole: globalRole,
        organizationMembership: undefined,
        currentOrganizationId: undefined,
      }

      if (organizationMembership) {
        const orgRoleRecord = await db('roles')
          .where({ id: organizationMembership.role_id })
          .select('name')
          .first()

        if (orgRoleRecord) {
          authInfo.organizationMembership = {
            organizationId: organizationMembership.organization_id,
            organizationRole: orgRoleRecord.name as Role,
          }

          authInfo.organizationType = organizationMembership.type
          authInfo.currentOrganizationId =
            organizationMembership.organization_id
        }
      }

      // Attach AuthInfo to the request
      req.authInfo = authInfo
      req.user = decoded

      next()
    } catch (error) {
      console.error('Authentication error:', error) // Log the error for debugging
      res.status(StatusCodes.UNAUTHORIZED).json({
        // Use 401 for invalid token as per typical auth flow
        ok: false,
        status: StatusCodes.UNAUTHORIZED,
        message: 'Invalid or expired token.',
      })
    }
  },
)

const optionalAuth = asyncMiddleware(async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    const authInfo: AuthInfo = {
      userId: '',
      currentOrganizationId: '',
    }

    req.authInfo = authInfo
    return next()
  }

  return authenticate(req, res, next)
})

export { authenticate, optionalAuth, AuthRequest }
