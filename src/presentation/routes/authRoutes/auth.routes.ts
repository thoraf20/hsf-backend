import { Router, Request, Response } from 'express'

import {
  loginSchema,
  UserSchema,
  verifyOtpSchema,
  resendOtpOtpSchema,
  RequestPasswordResetOtpSchema,
  ResetPasswordOtpSchema,
  verifyMfaSchema,
  RegisterEmail,
} from '../../../application/requests/dto/userValidator'
import { AuthService } from '../../../application/useCases/Auth/Auth'
import { UserRepository } from '../../../infrastructure/repositories/user/UserRepository'
import { AuthController } from '../../../presentation/controllers/Auth.controller'
import { asyncMiddleware, validateRequest } from '../index.t'
import { bruteforce } from '../../../middleware/security'


const service = new AuthService(new UserRepository())
const controller = new AuthController(service)
const authRoutes: Router = Router()


authRoutes.post('/verify-email', validateRequest(RegisterEmail), asyncMiddleware(async (req, res) => {
         const {body} = req 
         const  verifyEmail = await controller.registerEmail(body)
         res.status(verifyEmail.statusCode).json(verifyEmail)
}) )

authRoutes.post(
  '/register',
  validateRequest(UserSchema),
  asyncMiddleware(async (req: Request, res: Response) => {
    const { body } = req
    const user = await controller.registerUser(body)
    res.status(user.statusCode).json(user)
  }),
)

authRoutes.post(
  '/login',
  bruteforce.prevent,
  validateRequest(loginSchema),
  asyncMiddleware(async (req: Request, res: Response) => {
    const { body } = req
    const user = await controller.login(body)
    res.status(user.statusCode).json(user)
  }),
)

authRoutes.post(
  '/verify-otp',
  validateRequest(verifyOtpSchema),
  asyncMiddleware(async (req: Request, res: Response) => {
    const { body } = req
    const user = await controller.verifyOtp(body)
    res.status(user.statusCode).json(user)
  }),
)

authRoutes.put(
  '/resend-otp',
  validateRequest(resendOtpOtpSchema),
  asyncMiddleware(async (req: Request, res: Response) => {
    const { body } = req
    const user = await controller.resendOtp(body.email)
    res.status(user.statusCode).json(user)
  }),
)

authRoutes.post(
  '/request-password-reset-otp',
  validateRequest(RequestPasswordResetOtpSchema),
  asyncMiddleware(async (req: Request, res: Response) => {
    const { body } = req
    const user = await controller.requestPasswordResetOtp(body.email)
    res.status(user.statusCode).json(user)
  }),
)

authRoutes.post(
  '/verify-mfa',
  validateRequest(verifyMfaSchema),
  asyncMiddleware(async (req: Request, res: Response) => {
    const { body } = req
    const user = await controller.verifyMfa(body.otp)
    res.status(user.statusCode).json(user)
  }),
)

authRoutes.post(
  '/reset-password',
  validateRequest(ResetPasswordOtpSchema),
  asyncMiddleware(async (req: Request, res: Response) => {
    const { body } = req
    const user = await controller.resetPasswordController(body)
    res.status(user.statusCode).json(user)
  }),
)

export default authRoutes
