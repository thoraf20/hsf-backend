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

export class AuthService {
  private userRepository: IUserRepository
  private readonly existingUsers: ExistingUsers
  private readonly hashData = new Hashing()
  private readonly client = new RedisClient()
  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository
    this.existingUsers = new ExistingUsers(this.userRepository)
  }

  /**
   * Validate if email or phone number already exists
   */

  /**
   * Register a new user
   */

  async checkRegisterEmail(input: Record<string, any>): Promise<void> {
    await this.existingUsers.beforeCreateEmail(input.email)
    const otp = generateRandomSixNumbers()
    const key = `${CacheEnumKeys.EMAIL_VERIFICATION_KEY}-${otp}`
    const details = {
      email: input.email,
      otp,
      type: OtpEnum.EMAIL_VERIFICATION,
      is_email_verified: false,
    }
    await this.client.setKey(key, details, 60)
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

    const email = regDetails.email // Get verified email
    delete input.tempId // Ensure tempId is not stored

    await this.existingUsers.beforeCreatePhone(input.phone_number)
    input.password = await this.userRepository.hashedPassword(input.password)
    const findRole = await this.userRepository.getRoleByName(Role.HOME_BUYER)

    let user = await this.userRepository.create(
      new User({ ...input, email, role_id: findRole.id }),
    )

    await this.userRepository.update(user.id, { is_email_verified: true })
    user = await this.userRepository.findById(user.id)
    delete user.password

    // Remove temp key after successful registration
    await this.client.deleteKey(tempKey)

    return user
  }

  /**
   * Verify use email or phone number
   */

  async verifyAccount(otp: string): Promise<any> {
    const key = `${CacheEnumKeys.EMAIL_VERIFICATION_KEY}-${otp}`
    const details = await this.client.getKey(key)

    if (!details) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid or expired OTP.',
      )
    }

    const { email, type } =
      typeof details === 'string' ? JSON.parse(details) : details

    if (type !== OtpEnum.EMAIL_VERIFICATION) {
      await this.client.deleteKey(key)
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid OTP type.',
      )
    }

    const tempId = uuidv4()
    const tempKey = `${CacheEnumKeys.CONTINUE_REGISTRATION}-${tempId}`
    await this.client.setKey(tempKey, { email, is_email_verified: true }, 600)
    await this.client.deleteKey(key) // Delete OTP after verification

    return { tempId } // Return temporary ID to the user
  }

  async resendOtp(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found.')
    }

    if (user.is_email_verified) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Email is already verified.',
      )
    }

    const otp = generateRandomSixNumbers()
    console.log(otp)
    const key = `${CacheEnumKeys.EMAIL_VERIFICATION_KEY}-${otp}`
    const details = { id: user.id, otp, type: OtpEnum.EMAIL_VERIFICATION }
    await this.client.setKey(key, details, 60)
    emailTemplates.emailVerificationEmail(email, otp.toString())
  }

  /**
   * Request forgotten password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found.')
    }

    const otp = generateRandomSixNumbers()
    console.log(otp)
    const key = `${CacheEnumKeys.PASSWORD_RESET_KEY}-${otp}`
    const details = { id: user.id, otp, type: OtpEnum.PASSWORD_RESET }
    await this.client.setKey(key, details, 60)
  }

  /**
   * Reset password using OTP
   */
  async resetPassword(input: ResetPasswordType): Promise<void> {
    const key = `${CacheEnumKeys.PASSWORD_RESET_KEY}-${input.otp}`
    const details = await this.client.getKey(key)
    console.log('Here')
    if (!details) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid or expired OTP.',
      )
    }

    const { id, type } = details

    if (type !== OtpEnum.PASSWORD_RESET) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid OTP type.',
      )
    }

    const user = await this.userRepository.findById(id)

    if (!user) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found.')
    }

    const newpassword = await this.userRepository.hashedPassword(
      input.newPassword,
    )
    await this.userRepository.update(id, { password: newpassword })
    await this.client.deleteKey(key)
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
    const isLocked = await this.client.getKey(lockKey)

    if (isLocked) {
      throw new ApplicationCustomError(
        StatusCodes.TOO_MANY_REQUESTS,
        'Too many failed login attempts. Please try again after 10 minutes.',
      )
    }

    const isValid = await this.userRepository.comparedPassword(
      input.password,
      user.password,
    )

    if (!isValid) {
      const failedLoginAttempts = (user.failed_login_attempts || 0) + 1

      if (failedLoginAttempts >= 3) {
        await this.client.setKey(lockKey, true, 600) // Lock account for 10 mins
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
    if (user.is_email_verified === false) {
      await this.resendOtp(user.email)
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Please verify your email, An otp is sent to your email',
      )
    }

    // Generate token

    user = await this.userRepository.findById(user.id)
    console.log(user.role)
    const token = await this.hashData.accessCode(user.user_id, user.role)
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
