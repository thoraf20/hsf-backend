import { IUserRepository } from '.../../../domain/interfaces/IUserRepository'
import { User } from '../../domain/entities/User'
import { RedisClient } from '../../infrastructure/cache/redisClient'
import { ExistingUsers } from './duplicate'
import { ApplicationCustomError } from '../../middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import {
  generateRandomSixNumbers,
  generateDefaultPassword,
} from '../../shared/utils/helpers'
import { CacheEnumKeys } from '../../domain/enums/cacheEnum'
import { OtpEnum } from '../../domain/enums/otpEnum'

export class Admin {
  private userRepository: IUserRepository
  private readonly client = new RedisClient()
  private readonly existingUsers: ExistingUsers
  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository
    this.existingUsers = new ExistingUsers(this.userRepository)
  }

  public async createAdmin(input: User): Promise<User> {
    await this.existingUsers.beforeCreate(input.email, input.phone_number)
    input.password = await this.userRepository.hashedPassword(input.password)
    const user = await this.userRepository.create(
      new User({ ...input, role_id: 2 }),
    )
    console.log(`Admin with id ${user.id} has been created`)
    return user
  }

  public async inviteAgents(input: User): Promise<User> {
    await this.existingUsers.beforeCreate(input.email, input.phone_number)
    const checkRole = await this.userRepository.getRoleByName(input.role)
    if (!checkRole) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'Role not found')
    }
    input.role_id = checkRole.id
    const password = await this.userRepository.hashedPassword(
      generateDefaultPassword(),
    )
    console.log(password)
    delete input.role
    let user = await this.userRepository.create(
      new User({ ...input, password, is_default_password: true }),
    )
    const otp = generateRandomSixNumbers()
    console.log(otp)
    const key = `${CacheEnumKeys.EMAIL_VERIFICATION_KEY}-${otp}`
    const details = { id: user.id, otp, type: OtpEnum.EMAIL_VERIFICATION }
    await this.client.setKey(key, details, 60)
    user = await this.userRepository.findById(user.id)
    return user
  }
}
