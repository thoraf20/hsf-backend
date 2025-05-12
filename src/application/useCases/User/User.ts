import { User } from '@domain/entities/User'
import { IUserRepository } from '@domain/interfaces/IUserRepository'
import { StatusCodes } from 'http-status-codes'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { CacheEnumKeys } from '@domain/enums/cacheEnum'
import { OtpEnum } from '@domain/enums/otpEnum'
import { RedisClient } from '@infrastructure/cache/redisClient'
import emailTemplates from '@infrastructure/email/template/constant'
import { v4 as uuidv4 } from 'uuid'
import { changePassword } from '@shared/types/userType'
import { Role } from '@routes/index.t'
import { MfaFlow } from '@domain/enums/userEum'

export class UserService {
  private userRepository: IUserRepository
  private readonly client = new RedisClient()
  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository
  }

  public async getUserProfile(user: string): Promise<User> {
    const users = await this.userRepository.findById(user)
    return users
  }

  public async update(input: Partial<User>, id: string): Promise<void> {
    const user = await this.userRepository.findById(id)
    delete input.id //prevent id override
    const [existedEmail, existedPhone] = await Promise.all([
      input.email
        ? this.userRepository.findByEmail(input.email)
        : Promise.resolve(null),
      input.phone_number
        ? this.userRepository.findByPhone(input.phone_number)
        : Promise.resolve(null),
    ])

    if (existedEmail && existedEmail.id !== id) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Email already exists',
      )
    }

    if (existedEmail?.id === id) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Your account is currently linked to this email',
      )
    }

    if (existedPhone && existedPhone.id !== id) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Phone number already exists',
      )
    }

    if (existedPhone?.id === id) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Your account is currently linked to this phone number',
      )
    }

    if (input.email) {
      if (!input.password) {
        throw new ApplicationCustomError(
          StatusCodes.BAD_REQUEST,
          'Password is required for email update',
        )
      }

      const validPassword = await this.userRepository.comparedPassword(
        input.password,
        user.password,
      )
      if (!validPassword) {
        throw new ApplicationCustomError(
          StatusCodes.BAD_REQUEST,
          'Password is incorrect',
        )
      }

      const token = uuidv4()
      const key = `${CacheEnumKeys.EMAIL_CHANGE}-${token}`
      const details = {
        id,
        token,
        type: OtpEnum.EMAIL_UPADTE,
        newEmail: input.email,
      }

      await this.client.setKey(key, details, 60 * 10)

      const verificationLink = `${process.env.FRONTEND_URL}/user/verify-email-changes?token=${token}`
      emailTemplates.changeEmail(input.email, verificationLink)
      throw new ApplicationCustomError(
        StatusCodes.OK,
        'A verification email has been sent. Please click the link to confirm the update.',
      )
    }
  }

  public async enable2fa(
    userId: string,
    totpEncryptedSecret: string,
    hashedRecoveryCodes: Array<string>,
  ) {
    await this.userRepository.update(userId, {
      is_mfa_enabled: true,
      require_authenticator_mfa: true,
      mfa_totp_secret: totpEncryptedSecret,
    })
    await this.userRepository.setRecoveryCodes(userId, hashedRecoveryCodes)
  }

  public async verifyUpdate(token: string): Promise<void> {
    const key = `${CacheEnumKeys.EMAIL_CHANGE}-${token}`
    const data = await this.client.getKey(key)

    if (!data)
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid or expired token',
      )
    if (data.type === OtpEnum.EMAIL_UPADTE) {
      await this.userRepository.update(data.id, { email: data.newEmail })
    }
    await this.client.deleteKey(key)
  }

  public async resetPassword(input: changePassword, id: string): Promise<void> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found')
    }

    if (
      !(await this.userRepository.comparedPassword(
        input.oldPassword,
        user.password,
      ))
    ) {
      throw new ApplicationCustomError(
        StatusCodes.UNAUTHORIZED,
        'Old password is incorrect',
      )
    }

    if (input.oldPassword === input.newPassword) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        "New password can't be the same as old password",
      )
    }

    const hashedNewPassword = await this.userRepository.hashedPassword(
      input.newPassword,
    )

    const updatePayload: Partial<User> = { password: hashedNewPassword }
    if (user.is_default_password) updatePayload.is_default_password = false

    await this.userRepository.update(id, updatePayload)
  }

  public async DisableMfa(
    id: string,
    flow: MfaFlow,
  ): Promise<{ is_mfa_enabled: boolean; totp_mfa_required: boolean }> {
    let user = await this.userRepository.findById(id)
    if (!user) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found')
    }

    if (!user.is_mfa_enabled) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        "You don't have MFA enabled on this account.",
      )
    }

    if (flow === MfaFlow.TOTP && user.role !== Role.HOME_BUYER) {
      throw new ApplicationCustomError(StatusCodes.FORBIDDEN, '')
    }

    if (flow === MfaFlow.EMAIL_OTP) {
      if (user.role === Role.HOME_BUYER) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'You are not permitted to use the email 2fa feature',
        )
      }

      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'As an admin you are not allowed to disabled the 2fa feature',
      )
    }

    user = await this.userRepository.update(id, {
      is_mfa_enabled: true,
      require_authenticator_mfa: false,
      mfa_totp_secret: null,
    })
    await this.userRepository.clearRecoveryCodesByUserId(user.id!)

    return {
      is_mfa_enabled: user.is_mfa_enabled,
      totp_mfa_required: !!user.require_authenticator_mfa,
    }
  }

  async resetRecoveryCodes(userId: string, hashedRecoveryCodes: Array<string>) {
    await this.userRepository.clearRecoveryCodesByUserId(userId)
    await this.userRepository.setRecoveryCodes(userId, hashedRecoveryCodes)
  }
}
