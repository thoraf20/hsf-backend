import { MfaController } from '@controllers/Mfa.controller'
import { validateRequest } from '@middleware/validateRequest'
import { createResponse } from '@presentation/response/responseType'
import { UserRepository } from '@repositories/user/UserRepository'
import { asyncMiddleware } from '@routes/index.t'
import { UserService } from '@use-cases/User/User'
import {
  disableMfaSchema,
  verifyMfaSetupSchema,
} from '@validators/mfaValidator'
import { Request, Response, Router } from 'express'
import { StatusCodes } from 'http-status-codes'

const mfaRoutes = Router()

const userService = new UserService(new UserRepository())
const mfaController = new MfaController(userService, new UserRepository())

mfaRoutes.post('/authenticator/setup', async (req: Request, res: Response) => {
  const { user: claim } = req
  const response = await mfaController.setup(claim.id)
  res.status(response.statusCode).json(response)
})

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
  '/mfa/authenticator',
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
