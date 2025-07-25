import { MfaController } from '@controllers/Mfa.controller'
import { validateRequest } from '@middleware/validateRequest'
import { createResponse } from '@presentation/response/responseType'
import { OrganizationRepository } from '@repositories/OrganizationRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { UserActivityLogRepository } from '@repositories/UserActivityLogRepository'
import { asyncMiddleware } from '@routes/index.t'
import { UserService } from '@use-cases/User/User'
import {
  disableMfaSchema,
  verifyMFaAccessSchema,
  verifyMfaSetupSchema,
} from '@validators/mfaValidator'
import { Request, Response, Router } from 'express'
import { StatusCodes } from 'http-status-codes'

const mfaRoutes = Router()

const userService = new UserService(
  new UserRepository(),
  new UserActivityLogRepository(),
  new OrganizationRepository(),
)
const mfaController = new MfaController(userService, new UserRepository())

mfaRoutes.post(
  '/verify',
  validateRequest(verifyMFaAccessSchema),
  asyncMiddleware(async (req: Request, res: Response) => {
    const { user: claim, body } = req
    const token = await mfaController.verifyMFaAccess(claim.id, body)
    const response = createResponse(
      StatusCodes.OK,
      'Mfa verified successfully',
      token,
    )
    res.status(response.statusCode).json(response)
  }),
)

mfaRoutes.post(
  '/authenticator/setup',
  asyncMiddleware(async (req: Request, res: Response) => {
    const { user: claim } = req
    const response = await mfaController.setup(claim.id)
    res.status(response.statusCode).json(response)
  }),
)

mfaRoutes.post(
  '/authenticator/verify',
  validateRequest(verifyMfaSetupSchema),
  asyncMiddleware(async (req: Request, res: Response) => {
    const { user: claim, body } = req

    const response = await mfaController.verify(body, claim.id)
    res.status(response.statusCode).json(response)
  }),
)

mfaRoutes.delete(
  '/authenticator',
  validateRequest(disableMfaSchema),
  asyncMiddleware(async (req, res) => {
    const { user: claim, body } = req
    const response = await mfaController.disableMfa(claim.id, body)
    res.status(response.statusCode).json(response)
  }),
)

mfaRoutes.post(
  '/recovery-codes/generate',
  asyncMiddleware(async (req, res) => {
    const { user: claim } = req
    const recoveryCodes = await mfaController.resetRecoveryCodes(claim.id)

    const response = createResponse(
      StatusCodes.OK,
      'Recovery codes generated. Store these securely. They will not be shown again.',
      {
        recovery_codes: recoveryCodes,
      },
    )
    res.status(response.statusCode).json(response)
  }),
)

export default mfaRoutes
