import { IUserRepository } from '.../../../domain/interfaces/IUserRepository'
import { User } from '../../../domain/entities/User'
import { RedisClient } from '../../../infrastructure/cache/redisClient'
import { ExistingUsers } from '../utils'
import { ApplicationCustomError } from '../../../middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import {
  generateRandomSixNumbers,
  generateDefaultPassword,
} from '../../../shared/utils/helpers'
import { CacheEnumKeys } from '../../../domain/enums/cacheEnum'
import { OtpEnum } from '../../../domain/enums/otpEnum'
import { Role } from '../../../domain/enums/rolesEmun'

export class Admin {
  private userRepository: IUserRepository
  private readonly client = new RedisClient()
  private readonly existingUsers: ExistingUsers
  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository
    this.existingUsers = new ExistingUsers(this.userRepository)
  }

  public async createAdmin(input: User): Promise<User> {
    await this.existingUsers.beforeCreateEmail(input.email)
    await this.existingUsers.beforeCreatePhone(input.phone_number)
    input.password = await this.userRepository.hashedPassword(input.password)
    const findRole = await this.userRepository.getRoleByName(Role.SUPER_ADMIN)
    const user = await this.userRepository.create(
      new User({ ...input, role_id: findRole.id }),
    )
    console.log(`Admin with id ${user.id} has been created`)
    return user
  }

  public async inviteAgents(input: User): Promise<User> {
    await this.existingUsers.beforeCreateEmail(input.email)
    await this.existingUsers.beforeCreatePhone(input.phone_number)
    const checkRole = await this.userRepository.getRoleByName(input.role)
    if (!checkRole) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'Role not found')
    }
    input.role_id = checkRole.id
    const defaultPassword = generateDefaultPassword()
    const password = await this.userRepository.hashedPassword(defaultPassword)
    console.log(defaultPassword)
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
    delete user.password
    return user
  }
}
