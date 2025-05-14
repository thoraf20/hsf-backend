import db from '@infrastructure/database/knex'
import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import { AuthInfo } from '../types/auth' // Adjust path if needed
import { Role } from '../domain/enums/rolesEmun'
import { asyncMiddleware } from '@routes/index.t'
import { ApplicationCustomError } from './errors/customError'
import { UserOrganizationMember } from '@entities/UserOrganizationMember'

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
        'user_organization_memberships',
      )
        .where({ user_id: userId })
        .select('organization_id', 'role_id')
        .first() // Select organization_id and role_id

      // 4. Construct AuthInfo object.  Only include the first membership.
      let authInfo: AuthInfo = {
        userId: userRecord.id,
        globalRole: globalRole,
        organizationMembership: undefined,
        // currentOrganizationId will be set by a later middleware if needed
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

export { authenticate, AuthRequest }
