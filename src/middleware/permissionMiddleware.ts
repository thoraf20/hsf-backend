import { StatusCodes } from 'http-status-codes'
// import { UserRepository } from '../infrastructure/repositories/user/UserRepository'
import { Role } from '../domain/enums/rolesEmun'
import { Request } from 'express'

// const userRepository = new UserRepository()

interface AuthRequest extends Request {
  user?: { id: string; role: Role } // Ensure `user` includes `role`
}

// // Middleware to check if the user is a Home Buyer
// export const isHomeBuyer = async (req: AuthRequest, res, next) => {
//   const { user } = req
//   console.log(user.id)
//   if (!user) {
//     return res.status(StatusCodes.UNAUTHORIZED).json({
//       ok: false,
//       status: StatusCodes.UNAUTHORIZED,
//       message: 'Unauthorized request',
//     })
//   }

//   const getUser = await userRepository.findById(user.id)
//   if (!getUser || getUser.role !== Role.HOME_BUYER) {
//     return res.status(StatusCodes.FORBIDDEN).json({
//       ok: false,
//       status: StatusCodes.FORBIDDEN,
//       message: 'Only Home Buyers can make this request',
//     })
//   }

//   next()
// }

// // Middleware to check if the user is an Admin
// export const isAdmin = async (req: AuthRequest, res, next) => {
//   const { user } = req
//   if (!user) {
//     return res.status(StatusCodes.UNAUTHORIZED).json({
//       ok: false,
//       status: StatusCodes.UNAUTHORIZED,
//       message: 'Unauthorized request',
//     })
//   }

//   const getUser = await userRepository.findById(user.id)
//   if (!getUser || getUser.role !== Role.ADMIN) {
//     return res.status(StatusCodes.FORBIDDEN).json({
//       ok: false,
//       status: StatusCodes.FORBIDDEN,
//       message: 'Only Admins can make this request',
//     })
//   }

//   next()
// }

// // Middleware to check if the user is a Developer
// export const isDevelopers = async (req: AuthRequest, res, next) => {
//   const { user } = req
//   if (!user) {
//     return res.status(StatusCodes.UNAUTHORIZED).json({
//       ok: false,
//       status: StatusCodes.UNAUTHORIZED,
//       message: 'Unauthorized request',
//     })
//   }

//   const getUser = await userRepository.findById(user.id)
//   if (!getUser || getUser.role !== Role.DEVELOPER) {
//     return res.status(StatusCodes.FORBIDDEN).json({
//       ok: false,
//       status: StatusCodes.FORBIDDEN,
//       message: 'Only Developers can make this request',
//     })
//   }

//   next()
// }


export const requireRole = (role: string) => {
  return (req: AuthRequest, res, next) => {
    console.log(role)
    if (req.user?.role !== role) {
     
      return res.status(StatusCodes.FORBIDDEN).json({ statusCode: StatusCodes.FORBIDDEN, message: 'Insufficient permissions' });
    }
    next();
  };
};