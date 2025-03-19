import { IUserRepository } from '../../domain/interfaces/IUserRepository'
import { User } from '../../domain/entities/User'
import { Hashing } from '../../utils/hashing'
import { ApplicationCustomError } from '../../middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import { RedisClient } from '../../infrastructure/cache/redisClient'
import { generateRandomSixNumbers } from '../../utils/helpers'
import { OtpEnum } from '../../domain/enums/otpEnum'
import { CacheEnumKeys } from '../../domain/enums/cacheEnum'
import { loginType, ResetPasswordType } from '../../domain/types/userType'

export class AuthService {
  private userRepository: IUserRepository
  private readonly hashData = new Hashing()
  private readonly client = new RedisClient()
  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository
  }

  /**
   * Validate if email or phone number already exists
   */
  private async beforeCreate(
    email: string,
    phone_number: string,
  ): Promise<void> {
    const [existingUser, existingPhone] = await Promise.all([
      this.userRepository.findByEmail(email),
      this.userRepository.findByPhone(phone_number),
    ])

    if (existingUser) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Email is already in use.',
      )
    }

    if (existingPhone) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Phone number is already in use.',
      )
    }
  }

  /**
   * Register a new user
   */
  async register(input: User): Promise<User> {
    await this.beforeCreate(input.email, input.phone_number)
    input.password = await this.hashData.hashing(input.password)
    const user = await this.userRepository.create(
      new User({ ...input, role_id: 1 }),
    )
    const otp = generateRandomSixNumbers()
    console.log(otp)
    const key = `${CacheEnumKeys.EMAIL_VERIFICATION_KEY}-${otp}`
    const details = { id: user.id, otp, type: OtpEnum.EMAIL_VERIFICATION }
    await this.client.setKey(key, details, 60)
    delete user.password
    return user
  }

  /**
   * Verify use email or phone number
   */

  async verifyAccount(otp: string): Promise<void> {
    const key = `${CacheEnumKeys.EMAIL_VERIFICATION_KEY}-${otp}`;
    const details = await this.client.getKey(key);
  
    if (!details) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid or expired OTP.'
      );
    }
  
    const { id, type } = typeof details === 'string' ? JSON.parse(details) : details;
    console.log(details)
  
    if (type !== OtpEnum.EMAIL_VERIFICATION) {
      await this.client.deleteKey(key);
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid OTP type.'
      );
    }
  
    const user = await this.userRepository.findById(id);
    if (!user) {
      await this.client.deleteKey(key); 
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found.');
    }
  
    await this.userRepository.update(id, { is_email_verified: true });
  

    await this.client.deleteKey(key);
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

    user.password = await this.hashData.hashing(input.newPassword)
    await this.userRepository.update(id, user)
    await this.client.deleteKey(key)
    
  }

  /**
   * Login user and return JWT token
   */
  async login(
    input: loginType
  ): Promise<{ token: string; user: Record<string, any> } | never> {
    const user = await this.userRepository.findByIdentifier(input.identifier) as any

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

    const isValid = await this.hashData.verifyHash(input.password, user.password)

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

    // Generate token
    const token = await this.hashData.accessCode(user.id)
    delete user.password
    return { token, ...user }
  }


/**
 * Verify MFA OTP
 */
async verifyMfa(otp: string): Promise<boolean> {
  const key = `${CacheEnumKeys.MFA_VERIFICATION_KEY}-${otp}`;
  const details = await this.client.getKey(key);

  if (!details) {
    throw new ApplicationCustomError(
      StatusCodes.BAD_REQUEST,
      'Invalid or expired OTP.' 
    );
  }

  const { id, type } = typeof details === 'string' ? JSON.parse(details) : details;
  const findUserById = await this.userRepository.findById(id);

  if (type !== OtpEnum.MFA_VERIFICATION || !findUserById) {
    await this.client.deleteKey(key);
    throw new ApplicationCustomError(
      StatusCodes.BAD_REQUEST,
      'Invalid OTP type or user mismatch.'
    );
  }

  await this.userRepository.update(id, { is_mfa_enabled: true });
  await this.client.deleteKey(key);
  return  true
}

}


