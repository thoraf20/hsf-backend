import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { ApplicationCustomError } from './errors/customError'
import { AuthInfo, PermissionCheck } from '../shared/utils/permission-policy' // Import AuthInfo and PermissionCheck types and helpers

// Extend Express's Request interface to include our authInfo
interface AuthRequest extends Request {
  authInfo?: AuthInfo
  // organizationId is now handled within AuthInfo's currentOrganizationId property if needed
}

// PermissionService is now used within individual PermissionCheck functions if needed,
// not directly by the authorize middleware itself.

/**
 * Creates an authorization middleware that checks if the authenticated user
 * satisfies the provided permission checks.
 *
 * @param checks One or more PermissionCheck functions to evaluate.
 * @returns Express middleware function.
 */
export const authorize = (...checks: PermissionCheck[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authInfo = req.authInfo

    if (!authInfo) {
      return next(
        new ApplicationCustomError(
          StatusCodes.UNAUTHORIZED,
          'Authentication required. User not found on request or is anonymous.',
        ),
      )
    }

    // Check if all provided permission checks pass for the user's authInfo
    for (const check of checks) {
      // This implementation assumes the combined logic (like RequireAny or All)
      // is passed as a single check if complex combinations are needed.
      // If multiple checks are passed to `authorize`, they are ALL required.
      if (!check(authInfo)) {
        // If any check fails, return forbidden
        return next(
          new ApplicationCustomError(
            StatusCodes.FORBIDDEN,
            'You do not have sufficient permissions to access this resource.',
          ),
        )
      }
    }

    // If all checks pass, continue to the next middleware/route handler
    next()
  }
}
