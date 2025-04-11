import { User } from '@domain/entities/User'
import { IUserRepository } from '@domain/interfaces/IUserRepository'
import { StatusCodes } from 'http-status-codes'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { resetPassword } from '@shared/types/userType'
import { CacheEnumKeys } from '@domain/enums/cacheEnum'
import { OtpEnum } from '@domain/enums/otpEnum'
import { RedisClient } from '@infrastructure/cache/redisClient'
import emailTemplates from '@infrastructure/email/template/constant'
import { v4 as uuidv4 } from 'uuid';



export class UserService {
  private userRepository: IUserRepository
  private readonly client = new RedisClient()
  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository
  }

  public async getUserProfile (user: string) : Promise<User> {
      const users = await this.userRepository.findById(user)
      delete users.password
      return users
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

  const token = uuidv4(); 
  const key = `${CacheEnumKeys.EMAIL_CHANGE}-${token}`;
  const details = {
    id,
    token,
    type: OtpEnum.EMAIL_UPADTE,
    newEmail: input.email,
  };

  await this.client.setKey(key, details, 60 * 10); 

  const verificationLink = `${process.env.FRONTEND_URL}/verify-email-changes?token=${token}`;
  emailTemplates.changeEmail(input.email, verificationLink);
  throw new ApplicationCustomError(
    StatusCodes.OK,
    'A verification email has been sent. Please click the link to confirm the update.',
  );
}

    
  }

  public async verifyUpdate(token: string): Promise<void> {
    const key = `${CacheEnumKeys.EMAIL_CHANGE}-${token}`
    const data = await this.client.getKey(key)
 
    if (!data)
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid or expired token', 
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
