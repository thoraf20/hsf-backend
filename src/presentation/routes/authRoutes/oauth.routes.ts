import { UserStatus } from '@domain/enums/userEum'
import { User } from '@entities/User'
import { getEnv } from '@infrastructure/config/env/env.config'
import { google } from '@infrastructure/oauth/google'
import { IAccountRepository } from '@interfaces/IAccountRepository'
import logger from '@middleware/logger'
import { createResponse } from '@presentation/response/responseType'
import { AccountRepository } from '@repositories/user/AccountRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { Role } from '@routes/index.t'
import { Hashing } from '@shared/utils/hashing'
import { createDate, TimeSpan } from '@shared/utils/time-unit'
import arctic, { generateCodeVerifier, generateState } from 'arctic'
import { Request, Response, Router } from 'express'
import { StatusCodes } from 'http-status-codes'

const accountRepository: IAccountRepository = new AccountRepository()
const userRepository = new UserRepository()
const hash = new Hashing()
const oauthRoutes = Router()

oauthRoutes.get('/google/login', async (req: Request, res: Response) => {
  const state = generateState()
  const codeVerifier = generateCodeVerifier()
  const scopes = ['openid', 'profile', 'email']

  const url = google.createAuthorizationURL(state, codeVerifier, scopes)

  const isDev = getEnv('NODE_ENV') === 'development'
  res.cookie('google_oauth_state', state, {
    httpOnly: true,
    path: '/',
    sameSite: isDev ? false : 'none',
    secure: !isDev,
    expires: createDate(new TimeSpan(10, 'm')),
  })

  res.cookie('code_verifier', codeVerifier, {
    httpOnly: true,
    path: '/',
    sameSite: isDev ? false : 'none',
    secure: !isDev,
    expires: createDate(new TimeSpan(10, 'm')),
  })

  const response = createResponse(
    StatusCodes.OK,
    'google oauth url generated successfully',
    {
      url: url.toString(),
    },
  )

  res.status(response.statusCode).json(response)
})

oauthRoutes.get('/google/callback', async (req: Request, res: Response) => {
  const stateCookie = req.cookies['google_oauth_state']
  const codeVerifier = req.cookies['code_verifier']

  const code = req.query.code as string | undefined
  const state = req.query.state as string | undefined

  try {
    if (!code || !state || !stateCookie || stateCookie !== state) {
      const response = createResponse(StatusCodes.BAD_REQUEST, 'bad request')
      res.status(response.statusCode).json(response)
      return
    }

    const tokens = await google.validateAuthorizationCode(code, codeVerifier)
    const idToken = tokens.idToken()
    const claims = <GoogleUserResult>arctic.decodeIdToken(idToken)

    if (!claims.email_verified) {
      const response = createResponse(
        StatusCodes.FORBIDDEN,
        'email not verified',
      )
      res.status(response.statusCode).json(response)
      return
    }

    let account = await accountRepository.findByProviderID(claims.sub)
    let user: User

    if (account) {
      user = await userRepository.findById(account.user_id)
    } else {
      user = await userRepository.findByEmail(claims.email)
    }

    if (!account) {
      const findRole = await userRepository.getRoleByName(Role.HOME_BUYER)
      if (!user) {
        user = await userRepository.create({
          first_name: claims.given_name,
          last_name: claims.family_name,
          is_email_verified: true,
          email: claims.email,
          image: claims.picture,
          password: '',
          role_id: findRole.id,
          status: UserStatus.Active,
        })
      }

      account = await accountRepository.create({
        user_id: user.id,
        provider: 'google',
        provider_account_id: claims.sub,
        access_token: '',
        refresh_token: '',
        scope: tokens.scopes().join(','),
        token_type: tokens.tokenType(),
        type: 'oauth',
      })
    }

    const isDev = getEnv('NODE_ENV') === 'development'
    res.cookie('google_oauth_state', '', {
      httpOnly: true,
      path: '/',
      sameSite: isDev ? false : 'none',
      secure: !isDev,
      maxAge: 0,
    })

    res.cookie('code_verifier', '', {
      httpOnly: true,
      path: '/',
      sameSite: isDev ? false : 'none',
      secure: !isDev,
      maxAge: 0,
    })

    const token = await hash.accessCode(user.id, user.role)
    const response = createResponse(
      StatusCodes.OK,
      'user logged in successfully',
      {
        token,
        ...user,
      },
    )

    res.status(response.statusCode).json(response)
    return
  } catch (e) {
    logger.error(`Error while authing via Google: ${e.message}`)
    const response = createResponse(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'something went wrong while authing',
    )
    res.status(response.statusCode).json(response)
    return
  }
})

interface GoogleUserResult {
  name: string
  email: string
  picture: string
  email_verified: boolean
  sub: string
  given_name: string
  family_name: string
}

export default oauthRoutes
