import { createResponse } from '@presentation/response/responseType'
import {
  generate2faSecret,
  generateRecoveryCodes,
  verifyCodeFromRecoveryCodeList,
} from '@shared/utils/totp'
import { UserService } from '@use-cases/User/User'
import { StatusCodes } from 'http-status-codes'
import { createTOTPKeyURI, verifyTOTP } from '@oslojs/otp'
import { sha256 } from '@oslojs/crypto/sha2'
import { decodeBase64, encodeBase64 } from '@oslojs/encoding'
import qrcode from 'qrcode'
import { getEnv } from '@infrastructure/config/env/env.config'
import { RedisClient } from '@infrastructure/cache/redisClient'
import { TimeSpan } from '@shared/utils/time-unit'
import { DisableMfaInput, VerifyMFASetupInput } from '@validators/mfaValidator'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { decryptToString, encryptString } from '@shared/utils/encrypt'
import { MfaFlow } from '@domain/enums/userEum'
import { UserRepository } from '@repositories/user/UserRepository'

const MFA_SETUP_KEY = 'mfa_setup_key'

export class MfaController {
  private readonly client = new RedisClient()
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
  ) {}

  async setup(userId: string) {
    const user = await this.userService.getUserProfile(userId)
    if (!user) {
      throw createResponse(StatusCodes.NOT_FOUND, 'User not found')
    }

    if (user.require_authenticator_mfa) {
      throw createResponse(StatusCodes.FORBIDDEN, 'Mfa setup already')
    }

    const [mfaSecretStr, mfaSecretBytes] = generate2faSecret()

    const totpURI = createTOTPKeyURI(
      getEnv('PLATFORM_NAME'),
      `${user.first_name} ${user.last_name}`,
      mfaSecretBytes,
      getEnv('TOTP_EXPIRES_IN'),
      getEnv('TOTP_LENGTH'),
    )

    const qrImageUrl = await qrcode.toDataURL(totpURI)

    const hash = encodeBase64(sha256(mfaSecretBytes))
    const encrypted = encodeBase64(encryptString(mfaSecretStr))
    await this.client.setKey(
      `${MFA_SETUP_KEY}:${hash}`,
      encrypted,
      new TimeSpan(30, 'm').toMilliseconds(),
    )

    return createResponse(
      StatusCodes.OK,
      'Scan the QR code or use the setup key',
      {
        secret: mfaSecretStr,
        qrImageUrl,
      },
    )
  }

  async verify(payload: VerifyMFASetupInput, userId: string) {
    const user = await this.userService.getUserProfile(userId)
    if (!user) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found')
    }

    if (user.require_authenticator_mfa) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Mfa setup already',
      )
    }

    const { code, secret } = payload
    const hash = encodeBase64(sha256(decodeBase64(secret)))

    const encryptedSecret = await (<Promise<string>>(
      this.client.getKey(`${MFA_SETUP_KEY}:${hash}`)
    ))

    if (!encryptedSecret) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Invalid secret key',
      )
    }

    const decryptedSecret = decryptToString(decodeBase64(encryptedSecret))

    const isValidGeneratedSecretCode = verifyTOTP(
      decodeBase64(decryptedSecret),
      getEnv('TOTP_EXPIRES_IN'),
      getEnv('TOTP_LENGTH'),
      code,
    )

    if (!isValidGeneratedSecretCode) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Invalid otp code',
      )
    }

    const { recoveryCodes, hashedRecoveryCodes } = generateRecoveryCodes(
      getEnv('MFA_RECOVERY_CODES_SIZE'),
    )

    await this.userService.enable2fa(
      userId,
      encryptedSecret,
      hashedRecoveryCodes,
    )

    return createResponse(StatusCodes.OK, 'mfa setup completed', {
      enable_2fa: true,
      recovery_codes: recoveryCodes,
      userId,
    })
  }

  async resetRecoveryCodes(userId: string) {
    const findUserById = await this.userService.getUserProfile(userId)
    if (!findUserById) {
      throw new ApplicationCustomError(StatusCodes.FORBIDDEN, 'User not found')
    }

    if (!findUserById.is_mfa_enabled) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        "You don't have MFA enabled on this account.",
      )
    }

    if (findUserById.require_authenticator_mfa) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Authenticator not set.  You must set up an authenticator app before disabling MFA.',
      )
    }

    const { hashedRecoveryCodes, recoveryCodes } = generateRecoveryCodes(
      getEnv('MFA_RECOVERY_CODES_SIZE'),
    )

    this.userService.resetRecoveryCodes(userId, hashedRecoveryCodes)

    return recoveryCodes
  }

  async disableMfa(userId: string, input: DisableMfaInput) {
    const findUserById = await this.userService.getUserProfile(userId)
    if (!findUserById) {
      throw new ApplicationCustomError(StatusCodes.FORBIDDEN, 'User not found')
    }

    if (!findUserById.is_mfa_enabled) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        "You don't have MFA enabled on this account.",
      )
    }

    if (findUserById.require_authenticator_mfa) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Authenticator not set.  You must set up an authenticator app before disabling MFA.',
      )
    }

    const flow = input.flow

    if (flow === MfaFlow.TOTP) {
      const decryptedSecret = decryptToString(
        decodeBase64(findUserById.mfa_totp_secret),
      )

      const isValidGeneratedSecretCode = verifyTOTP(
        decodeBase64(decryptedSecret),
        getEnv('TOTP_EXPIRES_IN'),
        getEnv('TOTP_LENGTH'),
        input.code,
      )

      if (!isValidGeneratedSecretCode) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'Invalid otp code',
        )
      }
    } else if (flow === MfaFlow.RecoveryCode) {
      const recoveryCodes = (
        await this.userRepository.getRecoveryCodes(userId)
      ).filter((code) => !code.used)

      const plainRecoveryCodes = recoveryCodes.map((code) => code.code)
      const match = verifyCodeFromRecoveryCodeList(
        input.code,
        plainRecoveryCodes,
      )

      if (!match) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'Invalid recovery code',
        )
      }
    }
    const data = this.userService.DisableMfa(userId, MfaFlow.TOTP)

    return createResponse(StatusCodes.OK, 'MFA disabled for the user.', data)
  }
}
