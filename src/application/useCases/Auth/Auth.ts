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

export class AuthService {
  private userRepository: IUserRepository
  private accountRepository: IAccountRepository
  private readonly existingUsers: ExistingUsers
  private readonly hashData = new Hashing()
  private readonly client = new RedisClient()
  constructor(
    userRepository: IUserRepository,
    accountRepository: IAccountRepository,
  ) {
    this.userRepository = userRepository
    this.accountRepository = accountRepository
    this.existingUsers = new ExistingUsers(this.userRepository)
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

      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Email is already in use.',
      )
    }
    const otp = generateRandomSixNumbers()
    console.log(otp)
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
  async register(
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

    //@ts-ignore
    delete input.user_id
    let user = await this.userRepository.create(
      new User({ ...input, email, role_id: findRole.id }),
    )

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
      console.log(id)
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
    console.log(otp)
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
  ): Promise<{ token: string; user: Record<string, any> } | never> {
    let user = (await this.userRepository.findByIdentifier(
      input.identifier,
    )) as any

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
    const role = await this.userRepository.getRoleById(user.role_id)
    if(user.is_email_verified === false && role.name !== Role.HOME_BUYER) { 
      throw new ApplicationCustomError(
        StatusCodes.UNAUTHORIZED,
        'Invite has not been accepted.',
      )
    }
    // if(user.force_password_reset === true && user.is_default_password === true) { 
    //   throw new ApplicationCustomError(
    //     StatusCodes.UNAUTHORIZED,
    //     'Please you have to change your password.',
    //   )
    // }
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
    const token = await this.hashData.accessCode(user.user_id, user.role)
    await this.client.deleteKey(lockKey)
    delete user.password
    return { token, ...user }
  }

  /**
   * Verify MFA OTP
   */
  async verifyMfa(otp: string): Promise<boolean> {
    const key = `${CacheEnumKeys.MFA_VERIFICATION_KEY}-${otp}`
    const details = await this.client.getKey(key)

    if (!details) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid or expired OTP.',
      )
    }

    const { id, type } =
      typeof details === 'string' ? JSON.parse(details) : details
    const findUserById = await this.userRepository.findById(id)

    if (type !== OtpEnum.MFA_VERIFICATION || !findUserById) {
      await this.client.deleteKey(key)
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid OTP type or user mismatch.',
      )
    }

    await this.userRepository.update(id, { is_mfa_enabled: true })
    await this.client.deleteKey(key)
    return true
  }
}
