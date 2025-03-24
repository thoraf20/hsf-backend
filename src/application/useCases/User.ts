import { CacheEnumKeys } from '../../domain/enums/cacheEnum'
import { User } from '../../domain/entities/User'
import { IUserRepository } from '../../domain/interfaces/IUserRepository'
import { generateRandomSixNumbers } from '../../shared/utils/helpers'
import { RedisClient } from '../../infrastructure/cache/redisClient'
import { OtpEnum } from '../../domain/enums/otpEnum'
import { ApplicationCustomError } from '../../middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import { resetPassword } from '../../shared/types/userType'

export class UserService {
  private userRepository: IUserRepository
  private readonly client = new RedisClient()
  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository
  }

  public async update(input: User, id: string): Promise<void> {
    const user = await this.userRepository.findById(id)
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

    if (existedPhone && existedPhone.id !== id) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Phone number already exists',
      )
    }

    if (input.email) {
      if(!input.password) {
        throw new ApplicationCustomError(
          StatusCodes.BAD_REQUEST,
          'Password is required for email update',
        )
      }
      const validPassword = await this.userRepository.comparedPassword(input.password, user.password)
      if(!validPassword) {
        throw new ApplicationCustomError(
          StatusCodes.BAD_REQUEST,
          'Password is incorrect',
        )
      }
      const token = generateRandomSixNumbers()
      console.log(token)
      const key = `${CacheEnumKeys.EMAIL_CHANGE}-${token}`
      const details = {
        id,
        token,
        type: OtpEnum.EMAIL_UPADTE,
        newEmail: input.email,
      }
      await this.client.setKey(key, details, 60)
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'A verification email has been sent. Please verify your new email before updating.',
      )
    }

    await this.userRepository.update(id, input)
  }

  public async verifyUpdate(otp: string): Promise<void> {
    const key = `${CacheEnumKeys.EMAIL_CHANGE}-${otp}`
    const data = await this.client.getKey(key)

    if (!data)
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid or expired otp',
      )
    console.log(data)
    if (data.type === OtpEnum.EMAIL_UPADTE) {
      await this.userRepository.update(data.id, { email: data.newEmail })
    }
    await this.client.deleteKey(key)
  }

  public async resetPassword(input: resetPassword, id: string): Promise<void> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found')
    }
    const isOldPasswordValid = await this.userRepository.comparedPassword(
      input.oldPassword,
      user.password,
    )
    if (!isOldPasswordValid) {
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
    await this.userRepository.update(id, { password: hashedNewPassword })
  }
  public async EnableAndDisableMfa(
    id: string,
  ): Promise<{ is_mfa_enabled: boolean }> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found')
    }

    const newMfaStatus = Boolean(!user.is_mfa_enabled)
    await this.userRepository.update(id, { is_mfa_enabled: newMfaStatus })
    console.log(`MFA status updated for user ${id}: ${newMfaStatus}`)
    return { is_mfa_enabled: newMfaStatus }
  }
}
