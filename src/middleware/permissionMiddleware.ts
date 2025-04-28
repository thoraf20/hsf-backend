import { StatusCodes } from 'http-status-codes'
import { Request } from 'express'
import { Role } from '../domain/enums/rolesEmun'

interface AuthRequest extends Request {
  user?: { id: string; role: Role } // Ensure `user` includes `role`
}

export const requireRoles = (roles: Role | Role[]) => {
  return (req: AuthRequest, res, next) => {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        statusCode: StatusCodes.UNAUTHORIZED,
        message: 'Unauthorized access',
      })
    }

    const userRoles = Array.isArray(req.user.role)
      ? req.user.role
      : [req.user.role]

    const allowedRoles = Array.isArray(roles) ? roles : [roles]

    const hasAccess = userRoles.some((role) => allowedRoles.includes(role))
    if (!hasAccess) {
      return res.status(StatusCodes.FORBIDDEN).json({
        statusCode: StatusCodes.FORBIDDEN,
        message: 'Insufficient permissions',
      })
    }

    next()
  }
}
