import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { PermissionService } from '@infrastructure/services/permissionService'
import { Permission } from '@domain/enums/permissionEnum'
import { ApplicationCustomError } from './errors/customError'

interface AuthRequest extends Request {
  user?: {
    // Assuming your auth middleware adds this structure
    id: string
    // other user properties like email, global role_id etc.
  }
  organizationId?: string // Optional, can be set by a preceding middleware if route is org-specific
}

interface AuthorizeOptions {
  /**
   * If true, user must have ALL permissions. If false (default), user must have AT LEAST ONE.
   */
  requireAll?: boolean
  /**
   * Optional function to extract organizationId from the request if the permission
   * needs to be checked in the context of a specific organization.
   * For example, (req) => req.params.orgId
   */
  getOrganizationId?: (req: AuthRequest) => string | undefined
}

const permissionService = new PermissionService()

/**
 * Creates an authorization middleware that checks if the authenticated user
 * has the required permission(s).
 *
 * @param requiredPermissions A single permission or an array of permissions.
 * @param options Optional configuration for the authorization check.
 * @returns Express middleware function.
 */
export const authorize = (
  requiredPermissions: Permission | Permission[],
  options?: AuthorizeOptions,
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const permissionsToCheck = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions]

    if (!req.user || !req.user.id) {
      return next(
        new ApplicationCustomError(
          StatusCodes.UNAUTHORIZED,
          'Authentication required. User not found on request.',
        ),
      )
    }

    const userId = req.user.id
    let organizationId: string | undefined = req.organizationId // Check if already set on request

    if (options?.getOrganizationId) {
      organizationId = options.getOrganizationId(req)
    }

    try {
      let hasPermission = false
      if (options?.requireAll) {
        hasPermission = await permissionService.hasAllPermissions(
          userId,
          permissionsToCheck,
          organizationId,
        )
      } else {
        // Default: User needs at least one of the permissions
        hasPermission = await permissionService.hasAnyPermission(
          userId,
          permissionsToCheck,
          organizationId,
        )
      }

      if (hasPermission) {
        next() // User has the required permission(s)
      } else {
        next(
          new ApplicationCustomError(
            StatusCodes.FORBIDDEN,
            'You do not have sufficient permissions to access this resource.',
          ),
        )
      }
    } catch (error) {
      console.error('Error during permission check:', error)
      next(
        new ApplicationCustomError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'An error occurred while verifying permissions.',
        ),
      )
    }
  }
}
