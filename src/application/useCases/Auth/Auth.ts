import { IUserRepository } from '@domain/interfaces/IUserRepository'
import { User } from '@domain/entities/User'
import { Hashing } from '@shared/utils/hashing'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import { RedisClient } from '@infrastructure/cache/redisClient'
import { generateRandomSixNumbers } from '@shared/utils/helpers'
import { OtpEnum } from '@domain/enums/otpEnum'
import { CacheEnumKeys } from '@domain/enums/cacheEnum'
import { loginType, ResetPasswordType } from '@shared/types/userType'
import { ExistingUsers } from '../utils'
import { Role } from '@domain/enums/rolesEmun'
import emailTemplates from '@infrastructure/email/template/constant'
import { v4 as uuidv4 } from 'uuid'
import { IAccountRepository } from '@interfaces/IAccountRepository'
import { ErrorCode } from '@shared/utils/error'
import { MfaToken } from '@shared/utils/mfa_token'
import { TimeSpan } from '@shared/utils/time-unit'
import { MfaFlow, UserStatus } from '@domain/enums/userEum'
import { decryptToString } from '@shared/utils/encrypt'
import { decodeBase64 } from '@oslojs/encoding'
import { verifyTOTP } from '@oslojs/otp'
import { getEnv } from '@infrastructure/config/env/env.config'
import { verifyCodeFromRecoveryCodeList } from '@shared/utils/totp'
import { ManageOrganizations } from '@use-cases/ManageOrganizations'
import { IOrganizationRepository } from '@interfaces/IOrganizationRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { LenderRepository } from '@repositories/Agents/LenderRepository'
import { AddressRepository } from '@repositories/user/AddressRepository'
import { DeveloperRespository } from '@repositories/Agents/DeveloperRepository'
import { PropertyRepository } from '@repositories/property/PropertyRepository'
import { DocumentRepository } from '@repositories/property/DcoumentRepository'

export class AuthService {
  private userRepository: IUserRepository
  private accountRepository: IAccountRepository
  private readonly existingUsers: ExistingUsers
  private readonly manageOrganizations: ManageOrganizations
  private readonly hashData = new Hashing()
  private readonly mfaTokenGen = new MfaToken()
  private readonly client = new RedisClient()
  constructor(
    userRepository: IUserRepository,
    accountRepository: IAccountRepository,
    organizationRepository: IOrganizationRepository,
  ) {
    this.userRepository = userRepository
    this.accountRepository = accountRepository
    this.existingUsers = new ExistingUsers(this.userRepository)
    this.manageOrganizations = new ManageOrganizations(
      organizationRepository,
      new UserRepository(),
      new LenderRepository(),
      new AddressRepository(),
      new DeveloperRespository(),
      new PropertyRepository(),
      new DocumentRepository(),
    )
  }

  async checkRegisterEmail(input: Record<string, any>): Promise<void> {
    const user = await this.userRepository.findByEmail(input.email)

    if (user) {
      if (!user.password || user.password.length === 0) {
        const account = await this.accountRepository.findByUserID(user.id)
        if (account) {
          throw new ApplicationCustomError(
            StatusCodes.CONFLICT,
            'This account was registered via OAuth. Please log in using your OAuth provider.',
            null,
            ErrorCode.OAUTH_REGISTERED,
          )
        }
      }

      const role = await this.userRepository.getRoleById(user.role_id)

      if (!role) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'We are unable to verify your account',
        )
      }

      if (user.role !== Role.HOME_BUYER) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'There was a problem validating your email. Please check the address and try again or contact support',
        )
      }

      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Email is already in use.',
      )
    }

    const otp = generateRandomSixNumbers()
    const key = `${CacheEnumKeys.EMAIL_VERIFICATION_KEY}-${otp}`
    const details = {
      email: input.email,
      otp,
      type: OtpEnum.EMAIL_VERIFICATION,
      is_email_verified: false,
    }
    await this.client.setKey(key, details, 600)
    emailTemplates.welcomeEmail(input.email, `${input.email}`)
    emailTemplates.emailVerificationEmail(input.email, otp.toString())
  }
  async   register(
    input: Omit<User, 'email' | 'tempId'> & { tempId: string },
  ): Promise<User> {
    const tempKey = `${CacheEnumKeys.CONTINUE_REGISTRATION}-${input.tempId}`
    const regDetails = await this.client.getKey(tempKey)

    if (!regDetails || !regDetails.is_email_verified) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Email is not verified. Please verify your email before registering.',
      )
    }

    const email = regDetails.email
    delete input.tempId
    await this.existingUsers.beforeCreatePhone(input.phone_number)
    input.password = await this.userRepository.hashedPassword(input.password)
    const findRole = await this.userRepository.getRoleByName(Role.HOME_BUYER)
    console.log(input)
    //@ts-ignore
    delete input.user_id
    let user = await this.userRepository.create({
      ...input,
      email,
      role_id: findRole.id,
      status: UserStatus.Active,
    })

    await this.userRepository.update(user.id, { is_email_verified: true })
    user = await this.userRepository.findById(user.id)
    delete user.password

    await this.client.deleteKey(tempKey)

    return user
  }

  async verifyAccount(otp: string): Promise<any> {
    const emailKey = `${CacheEnumKeys.EMAIL_VERIFICATION_KEY}-${otp}`
    const passwordKey = `${CacheEnumKeys.PASSWORD_RESET_KEY}-${otp}`
    const details =
      (await this.client.getKey(emailKey)) ||
      (await this.client.getKey(passwordKey))
    await this.client.checkAndClearCache(emailKey)
    await this.client.checkAndClearCache(passwordKey)
    if (!details) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid or expired OTP.',
      )
    }

    const { email, type, id } =
      typeof details === 'string' ? JSON.parse(details) : details

    const tempId = uuidv4()

    if (type === OtpEnum.EMAIL_VERIFICATION) {
      const tempKey = `${CacheEnumKeys.CONTINUE_REGISTRATION}-${tempId}`
      await this.client.setKey(tempKey, { email, is_email_verified: true }, 600)
    }

    if (type === OtpEnum.PASSWORD_RESET) {
      const tempKey = `${CacheEnumKeys.PASSWORD_RESET_KEY}-${tempId}`
      await this.client.setKey(tempKey, { id, is_email_verified: true }, 600)
    }

    await this.client.deleteKey(emailKey)
    await this.client.deleteKey(passwordKey)

    return { tempId }
  }

  async resendOtp(email: string): Promise<void | any> {
    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      return false
    }

    if (user.is_email_verified) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Email is already verified.',
      )
    }

    const otp = generateRandomSixNumbers()

    const key = `${CacheEnumKeys.EMAIL_VERIFICATION_KEY}-${otp}`
    const details = { id: user.id, otp, type: OtpEnum.EMAIL_VERIFICATION }
    await this.client.setKey(key, details, 60)
    emailTemplates.emailVerificationEmail(email, otp.toString())
  }

  /**
   * Request forgotten password reset
   */
  async requestPasswordReset(email: string): Promise<void | boolean> {
    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      return false
    }

    const otp = generateRandomSixNumbers()
    const key = `${CacheEnumKeys.PASSWORD_RESET_KEY}-${otp}`
    const details = { id: user.id, otp, type: OtpEnum.PASSWORD_RESET }
    await this.client.setKey(key, details, 600)
    emailTemplates.ResetVerificationEmail(email, otp.toString())
  }

  /**
   * Reset password using OTP
   */
  async resetPassword(input: ResetPasswordType): Promise<void> {
    const tempKey = `${CacheEnumKeys.PASSWORD_RESET_KEY}-${input.tempId}`
    const regDetails = await this.client.getKey(tempKey)
    await this.client.checkAndClearCache(tempKey)
    if (!regDetails) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Session expired....',
      )
    }

    const { id } = regDetails

    const user = await this.userRepository.findById(id)

    if (!user) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found.')
    }

    const newpassword = await this.userRepository.hashedPassword(
      input.newPassword,
    )
    await this.userRepository.update(id, { password: newpassword })
    await this.client.deleteKey(tempKey)
  }

  /**
   * Login user and return JWT token
   */
  async login(
    input: loginType,
    isAdminRequest?: boolean,
  ): Promise<({ token: string; mfa_required: boolean } & User) | never> {
    let user = (await this.userRepository.findByIdentifier(
      input.identifier,
    )) as User

    if (!user) {
      throw new ApplicationCustomError(
        StatusCodes.UNAUTHORIZED,
        'Invalid email or password.',
      )
    }

    const lockKey = `${CacheEnumKeys.LOGIN_ATTEMPT_LOCK}-${user.id}`
    await this.client.checkAndClearCache(lockKey)
    const isLocked = await this.client.getKey(lockKey)

    if (isLocked) {
      throw new ApplicationCustomError(
        StatusCodes.TOO_MANY_REQUESTS,
        'Too many failed login attempts. Please try again after 10 minutes.',
      )
    }

    if (!user.password || user.password.length === 0) {
      const account = await this.accountRepository.findByUserID(user.id)

      if (account) {
        throw new ApplicationCustomError(
          StatusCodes.CONFLICT,
          'This account was registered via OAuth. Please log in using your OAuth provider.',
        )
      }
    }

    if (user.status === UserStatus.Deleted) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Your account has been deleted. It may be recoverable within 90 days of deletion. Please contact our support team for assistance with account recovery.',
      )
    }

    if ([UserStatus.Banned, UserStatus.Suspended].includes(user.status)) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        `Your account is currently ${user.status}. You can contact our support team to inquire about recovering your account.`,
      )
    }

    const role = await this.userRepository.getRoleById(user.role_id)

    if (!role) {
      throw new ApplicationCustomError(
        StatusCodes.UNAUTHORIZED,
        'Sorry!, We are unable to sign you into your account',
      )
    }

    if (!(isAdminRequest || role.name === Role.HOME_BUYER)) {
      throw new ApplicationCustomError(
        StatusCodes.UNAUTHORIZED,
        'Sorry!, We are unable to sign you into your account',
      )
    }

    if (user.is_mfa_enabled) {
      const token = await this.mfaTokenGen.accessCode(
        user.id ?? user.user_id,
        user.role,
      )
      if (user.require_authenticator_mfa) {
        throw new ApplicationCustomError(
          StatusCodes.CREATED,
          `Please open your authenticator app and enter the one-time
        password (OTP) shown for your account.`,
          {
            token: token,
            mfa_required: true,
            mfa_type: MfaFlow.TOTP,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            id: user.id,
          },
        )
      }

      const otp = generateRandomSixNumbers()
      console.log(otp)
      const cacheKey = `${CacheEnumKeys.MFA_VERIFICATION_KEY}-${user.id ?? user.user_id}`
      await this.client.setKey(
        cacheKey,
        {
          otp,
        },
        new TimeSpan(10, 'm').toMilliseconds(),
      )

      emailTemplates.sendMfaOtpEmail(
        user.email,
        String(otp),
        'http://localhost:3000/suport',
      )
      throw new ApplicationCustomError(
        StatusCodes.CREATED,
        `We've sent a one-time password (OTP) to your registered email address.
        Please check your email and enter the OTP to continue.`,
        {
          token: token,
          mfa_required: true,
          mfa_type: MfaFlow.EMAIL_OTP,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          id: user.id,
        },
      )
    }

    if (
      user.force_password_reset === true &&
      user.is_default_password === true
    ) {
      throw new ApplicationCustomError(
        StatusCodes.UNAUTHORIZED,
        'Please you have to change your password.',
      )
    }
    const isValid = await this.userRepository.comparedPassword(
      input.password,
      user.password,
    )

    if (!isValid) {
      const failedLoginAttempts = (user.failed_login_attempts || 0) + 1
      if (failedLoginAttempts >= 3) {
        await this.client.setKey(lockKey, true, 600)
        await this.userRepository.update(user.id, {
          failed_login_attempts: failedLoginAttempts,
        })

        throw new ApplicationCustomError(
          StatusCodes.TOO_MANY_REQUESTS,
          'Too many failed login attempts. Please try again after 10 minutes.',
        )
      }

      await this.userRepository.update(user.id, {
        failed_login_attempts: failedLoginAttempts,
      })

      throw new ApplicationCustomError(
        StatusCodes.UNAUTHORIZED,
        'Invalid email or password.',
      )
    }

    if (user.failed_login_attempts > 0) {
      await this.userRepository.update(user.id, { failed_login_attempts: 0 })
    }
    user = await this.userRepository.findById(user.id)
    user.accounts = await this.accountRepository.findByUserID(user.id)
    user.accounts.forEach((account) => {
      delete account.access_token
      delete account.refresh_token
      delete account.token_type
    })

    user.membership = await this.manageOrganizations.getOrganizationsForUser(
      user.id,
    )
    const token = await this.hashData.accessCode(user.user_id, user.role)
    await this.client.deleteKey(lockKey)
    delete user.password
    return { token, mfa_required: false, ...user }
  }

  async sendMfaEmailOtp(userId: string) {
    const user = await this.userRepository.findById(userId)
    if (!user.is_mfa_enabled) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        "You don't have 2fa enabled on this account",
      )
    }

    if (user.require_authenticator_mfa) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        `You have authenticator app set up, so you are required to enter the one-time
          password (OTP) shown for your account.`,
      )
    }

    const otp = generateRandomSixNumbers()

    const cacheKey = `${CacheEnumKeys.MFA_VERIFICATION_KEY}-${user.id ?? user.user_id}`
    await this.client.setKey(
      cacheKey,
      {
        otp,
      },
      new TimeSpan(10, 'm').toMilliseconds(),
    )

    emailTemplates.sendMfaOtpEmail(
      user.email,
      String(otp),
      'http://localhost:3000/suport',
    )
  }
  /**
   * Verify MFA OTP
   */
  async verifyMfa(otp: string, userId: string, flow: MfaFlow) {
    let findUserById = await this.userRepository.findById(userId)
    if (!findUserById) {
      throw new ApplicationCustomError(StatusCodes.FORBIDDEN, 'User not found')
    }

    if (!findUserById.is_mfa_enabled) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        "You don't have MFA enabled on this account.",
      )
    }

    delete findUserById.password
    const token = await this.hashData.accessCode(
      findUserById.id,
      findUserById.role,
    )
    if (flow === MfaFlow.EMAIL_OTP) {
      const key = `${CacheEnumKeys.MFA_VERIFICATION_KEY}-${userId}`
      const details = await this.client.getKey(key)

      if (!details) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'Invalid or expired OTP.',
        )
      }

      const { otp: currentOtp } =
        typeof details === 'string' ? JSON.parse(details) : details

      if (String(currentOtp) !== String(otp)) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'Invalid or expired OTP.',
        )
      }

      await this.client.deleteKey(key)

      return { token, ...findUserById }
    }

    if (!findUserById.require_authenticator_mfa) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Authenicator not set',
      )
    }

    if (flow === MfaFlow.TOTP) {
      const decryptedSecret = decryptToString(
        decodeBase64(findUserById.mfa_totp_secret),
      )

      const isValidGeneratedSecretCode = verifyTOTP(
        decodeBase64(decryptedSecret),
        getEnv('TOTP_EXPIRES_IN'),
        getEnv('TOTP_LENGTH'),
        otp,
      )

      if (!isValidGeneratedSecretCode) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'Invalid otp code',
        )
      }

      findUserById.accounts = await this.accountRepository.findByUserID(
        findUserById.id,
      )
      findUserById.accounts.forEach((account) => {
        delete account.access_token
        delete account.refresh_token
        delete account.token_type
      })

      if (
        !findUserById.is_email_verified ||
        findUserById.status === UserStatus.Pending
      ) {
        await this.userRepository.update(findUserById.id, {
          is_email_verified: true,
          status: UserStatus.Active,
        })
      }

      findUserById.membership =
        await this.manageOrganizations.getOrganizationsForUser(findUserById.id)

      return { token, ...findUserById }
    }

    if (flow === MfaFlow.RecoveryCode) {
      const recoveryCodes = (
        await this.userRepository.getRecoveryCodes(userId)
      ).filter((code) => !code.used)

      const plainRecoveryCodes = recoveryCodes.map((code) => code.code)
      const match = verifyCodeFromRecoveryCodeList(otp, plainRecoveryCodes)

      if (!match) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'Invalid recovery code',
        )
      }

      const usedCode = recoveryCodes.find(({ code: hash }) => hash === match)
      await this.userRepository.updateRecoveryCodeById(usedCode.id, {
        used: true,
      })
      return { token, ...findUserById }
    }

    throw new ApplicationCustomError(
      StatusCodes.FORBIDDEN,
      `Invalid MFA flow ${flow}`,
    )
  }
}
