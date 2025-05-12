import { Router, Request, Response } from 'express'

import {
  loginSchema,
  UserSchema,
  verifyOtpSchema,
  resendOtpOtpSchema,
  RequestPasswordResetOtpSchema,
  ResetPasswordOtpSchema,
  RegisterEmail,
  verifyMfaSchema,
  VerifyMfaInput,
  sendMfaOtpSchema,
} from '@application/requests/dto/userValidator'
import { AuthService } from '@application/useCases/Auth/Auth'
import { UserRepository } from '@infrastructure/repositories/user/UserRepository'
import { AuthController } from '@presentation/controllers/Auth.controller'
import { asyncMiddleware, validateRequest } from '../index.t'
import { bruteforce } from '@middleware/security'
import { AccountRepository } from '@repositories/user/AccountRepository'
import { MfaToken } from '@shared/utils/mfa_token'
import { StatusCodes } from 'http-status-codes'
import { ApplicationCustomError } from '@middleware/errors/customError'

const service = new AuthService(new UserRepository(), new AccountRepository())
const mfaTokenGen = new MfaToken()
const controller = new AuthController(service)
const authRoutes: Router = Router()

authRoutes.post(
  '/verify-email',
  validateRequest(RegisterEmail),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const verifyEmail = await controller.registerEmail(body)
    res.status(verifyEmail.statusCode).json(verifyEmail)
  }),
)

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
    const { body }: { body: VerifyMfaInput } = req
    const tokenValid = await mfaTokenGen.verifyCode(body.token)

    if (!tokenValid) {
      throw new ApplicationCustomError(
        StatusCodes.UNAUTHORIZED,
        'Your MFA session is invalid or has expired. Please try logging in again.',
      )
    }
    const user = await controller.verifyMfa(body.code, tokenValid.id, body.flow)
    res.status(user.statusCode).json(user)
  }),
)

authRoutes.post(
  '/mfa/send-otp',
  validateRequest(sendMfaOtpSchema),
  async (req, res) => {
    const { body }: { body: VerifyMfaInput } = req
    const tokenValid = await mfaTokenGen.verifyCode(body.token)

    if (!tokenValid) {
      throw new ApplicationCustomError(
        StatusCodes.UNAUTHORIZED,
        'Your MFA session is invalid or has expired. Please try logging in again.',
      )
    }

    const response = await controller.sendMfaOtp(tokenValid.id)
    res.status(response.statusCode).json(response)
  },
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
