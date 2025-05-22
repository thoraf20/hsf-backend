import { getUserClientView, User } from '@domain/entities/User'
import { IUserRepository } from '@domain/interfaces/IUserRepository'
import { StatusCodes } from 'http-status-codes'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { CacheEnumKeys } from '@domain/enums/cacheEnum'
import { OtpEnum } from '@domain/enums/otpEnum'
import { RedisClient } from '@infrastructure/cache/redisClient'
import { v4 as uuidv4 } from 'uuid'
import { changePassword } from '@shared/types/userType'
import { Role } from '@routes/index.t'
import { MfaFlow, UserStatus } from '@domain/enums/userEum'
import {
  ChangePasswordCompleteInput,
  ChangePasswordInput,
  UpdateProfileImageInput,
  UserFilters,
} from '@validators/userValidator'
import { TimeSpan } from '@shared/utils/time-unit'
import { verifyCodeFromRecoveryCodeList } from '@shared/utils/totp'
import { verifyTOTP } from '@oslojs/otp'
import { decodeBase64 } from '@oslojs/encoding'
import { getEnv } from '@infrastructure/config/env/env.config'
import { decryptToString } from '@shared/utils/encrypt'

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

  public async getUsers(query: UserFilters) {
    return this.userRepository.getAllUsers(query)
  }

  public async update(input: Partial<User>, id: string) {
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

    const updatedUser = await this.userRepository.update(user.id, {
      first_name: input.first_name,
      last_name: input.last_name,
      image: input.image,
      phone_number: input.phone_number,
    })
    return getUserClientView(updatedUser!)
  }

  /*
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
  } */

  public async updateProfileImage(id: string, input: UpdateProfileImageInput) {
    const updatedUser = await this.userRepository.update(id, {
      image: input.image,
    })

    if (!updatedUser) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found')
    }

    return getUserClientView(updatedUser)
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
      is_mfa_enabled: user.role !== Role.HOME_BUYER,
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

  async initiateChangeUserPassword(id: string, input: ChangePasswordInput) {
    const user = await this.userRepository.findById(id)
    if (!user || user.status === UserStatus.Deleted) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found')
    }

    if (
      !(
        user.status === UserStatus.Active || user.status === UserStatus.Inactive
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        `Password change not allowed for user with status: ${user.status}. Account must be active or inactive.`,
      )
    }

    const isMatchPassword = await this.userRepository.comparedPassword(
      input.current_password,
      user.password,
    )

    if (!isMatchPassword) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Current password not a match',
      )
    }

    const isSameWithOldPassword = await this.userRepository.comparedPassword(
      input.new_password,
      user.password,
    )

    if (isSameWithOldPassword) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'New password cannot be the same as the current password.',
      )
    }

    const hashedPassword = await this.userRepository.hashedPassword(
      input.new_password,
    )

    if (user.require_authenticator_mfa) {
      const id = uuidv4()
      await this.client.setKey(
        `${CacheEnumKeys.PASSWORD_CHANGE_MFA}-${id}`,
        {
          new_password: hashedPassword,
          email: user.email,
          user_id: user.id ?? user.user_id!,
        },
        new TimeSpan(1, 'h').toMilliseconds(),
      )

      return {
        token: id,
        mfa_required: true,
      }
    }

    const passwordChangeToken = uuidv4()
    await this.client.setKey(
      `${CacheEnumKeys.RESET_PASSWORD}-${passwordChangeToken}`,
      {
        new_password: hashedPassword,
        email: user.email,
        user_id: user.id ?? user.user_id!,
      },
      new TimeSpan(1, 'h').toMilliseconds(),
    )

    return {
      token: passwordChangeToken,
      mfa_required: false,
    }
  }

  async verifyChangePasswordMfa(
    user: User,
    flow: MfaFlow,
    token: string,
    code: string,
  ) {
    if (flow === MfaFlow.EMAIL_OTP) {
      const totpKey = `${CacheEnumKeys.PASSWORD_CHANGE_MFA_TOTP}-${code}`
      const totpSecret = await (<Promise<string | null>>(
        this.client.getKey(totpKey)
      ))

      if (!(totpSecret && totpSecret === token)) {
        throw new ApplicationCustomError(StatusCodes.FORBIDDEN, '')
      }

      await this.client.deleteKey(totpKey)
    }

    const sessionData: {
      new_password: string
      email: string
      user_id: string
    } | null = await this.client.getKey(
      `${CacheEnumKeys.PASSWORD_CHANGE_MFA}-${token}`,
    )

    if (!(sessionData && sessionData.user_id === user.id)) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Invalid or expired session',
      )
    }

    await this.verifyTOTP(user, flow, code) //throw error incase of invalid code

    const resetPasswordToken = uuidv4()
    await this.client.setKey(
      `${CacheEnumKeys.RESET_PASSWORD}-${resetPasswordToken}`,
      sessionData,
      new TimeSpan(1, 'h').toMilliseconds(),
    )

    await this.client.deleteKey(`${CacheEnumKeys.PASSWORD_CHANGE_MFA}-${token}`)

    return {
      token: resetPasswordToken,
    }
  }

  async verifyTOTP(
    user: User,
    flow: MfaFlow,
    code: string,
    markAsUsed?: boolean,
  ) {
    if (!user.require_authenticator_mfa) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Authenicator not set',
      )
    }

    if (flow === MfaFlow.TOTP) {
      const decryptedSecret = decryptToString(
        decodeBase64(user.mfa_totp_secret),
      )

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
    }

    if (flow === MfaFlow.RecoveryCode) {
      const recoveryCodes = await this.userRepository.getRecoveryCodes(
        user.id ?? user.user_id,
      )

      const plainRecoveryCodes = recoveryCodes.map((code) => code.code)
      const match = verifyCodeFromRecoveryCodeList(code, plainRecoveryCodes)

      if (!match) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'Invalid recovery code',
        )
      }

      const usedCode = recoveryCodes.find(({ code: hash }) => hash === match)

      if (usedCode.used) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'This recovery code has been previously used.',
        )
      }

      if (markAsUsed) {
        await this.userRepository.updateRecoveryCodeById(usedCode.id, {
          used: true,
        })
      }
      return usedCode
    }

    return null
  }

  async completeChangePassword(
    userId: string,
    input: ChangePasswordCompleteInput,
  ) {
    const user = await this.userRepository.findById(userId)
    if (!user || user.status === UserStatus.Deleted) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found')
    }

    if (
      !(
        user.status === UserStatus.Active || user.status === UserStatus.Inactive
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        `Password change not allowed for user with status: ${user.status}. Account must be active or inactive.`,
      )
    }

    const sessionData: {
      new_password: string
      email: string
      user_id: string
    } | null = await this.client.getKey(
      `${CacheEnumKeys.RESET_PASSWORD}-${input.token}`,
    )

    if (
      !(
        sessionData &&
        sessionData.user_id === userId &&
        sessionData.email === user.email
      )
    ) {
      throw new ApplicationCustomError(StatusCodes.FORBIDDEN, '')
    }

    await this.userRepository.update(userId, {
      password: sessionData.new_password,
    })
  }

  async getRoles() {
    return this.userRepository.getRoles()
  }
}
