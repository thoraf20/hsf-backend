import { IUserRepository } from '@domain/interfaces/IUserRepository'
import { User } from '@domain/entities/User'
import { RedisClient } from '@infrastructure/cache/redisClient'
import { DeveloperUtils, ExistingUsers } from '../utils'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import {
  generateRandomSixNumbers,
  generateDefaultPassword,
} from '@shared/utils/helpers'
import { CacheEnumKeys } from '@domain/enums/cacheEnum'
import { OtpEnum } from '@domain/enums/otpEnum'
import { Role } from '@domain/enums/rolesEmun'
import { Developer, DevelopeReg } from '@entities/Developer'
import { IDeveloperRepository } from '@interfaces/IDeveloperRespository'

export class Agents {
  private userRepository: IUserRepository
  private readonly developerRepository: IDeveloperRepository
  private readonly client = new RedisClient()
  private readonly existingUsers: ExistingUsers
  private readonly developer: DeveloperUtils
  constructor(userRepository: IUserRepository, developerRepository: IDeveloperRepository) {
    this.userRepository = userRepository
    this.developerRepository = developerRepository
    this.existingUsers = new ExistingUsers(this.userRepository)
    this.developer = new DeveloperUtils(this.developerRepository)
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

  public async createDevelopers (input: DevelopeReg):Promise<DevelopeReg> {
    await Promise.all([ 
      this.developer.findIfCompanyNameExist(input.company_name),
      this.developer.findIfCompanyRegistrationNumberExist(
        input.company_registration_number,
      ),
      await this.existingUsers.beforeCreateEmail(input.email),
      await this.existingUsers.beforeCreatePhone(input.phone_number),
      this.developer.findIfCompanyEmailExist(input.company_email),
    ])
    const defaultPassword = generateDefaultPassword()
    const password = await this.userRepository.hashedPassword(defaultPassword)
    const findRole = await this.userRepository.getRoleByName(Role.DEVELOPER)
    let user = await this.userRepository.create(
      new User({ ...input, password, is_default_password: true, role_id: findRole.id }),
    )
    const developer = await this.userRepository.create(
      new Developer({
        company_email: input.company_email,
        company_name: input.company_name,
        company_registration_number: input.company_registration_number,
        office_address: input.office_address,
        state: input.state,
        city: input.city,
        developer_role: input.developer_role,
        years_in_business: input.years_in_business,
        specialization: input.specialization,
        region_of_operation: input.region_of_operation,
        company_image: input.company_image,
        documents: input.documents,
        developers_profile_id: user.id
       }),
    )
    const otp = generateRandomSixNumbers()
    const key = `${CacheEnumKeys.EMAIL_VERIFICATION_KEY}-${otp}`
    const details = { id: user.id, otp, type: OtpEnum.DEVELOPER_EMAIL_VERIFICATION, password}
    await this.client.setKey(key, details, 60)
    user = await this.userRepository.findById(user.id)
    return { ...user, ...developer }
    
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
