import { StatusCodes } from 'http-status-codes'
import { Role } from '../domain/enums/rolesEmun'
import { Request } from 'express'


interface AuthRequest extends Request {
  user?: { id: string; role: Role } // Ensure `user` includes `role`
}




export const requireRole = (role: string) => {
  return (req: AuthRequest, res, next) => {
    console.log(role)
    if (req.user?.role !== role) {
     
      return res.status(StatusCodes.FORBIDDEN).json({ statusCode: StatusCodes.FORBIDDEN, message: 'Insufficient permissions' });
    }
    next();
  };
};