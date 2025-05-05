import { IUserRepository } from '@domain/interfaces/IUserRepository'
import { invitation, User, UserRegProfile } from '@domain/entities/User'
import { RedisClient } from '@infrastructure/cache/redisClient'
import { DeveloperUtils, ExistingUsers } from '../utils'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import emailTemplates from '@infrastructure/email/template/constant'
import {
  generateRandomSixNumbers,
  generateDefaultPassword,
  generateInvitationToken,
} from '@shared/utils/helpers'
import { CacheEnumKeys } from '@domain/enums/cacheEnum'
import { OtpEnum } from '@domain/enums/otpEnum'
import { Role } from '@domain/enums/rolesEmun'
import { Developer, DevelopeReg } from '@entities/Developer'
import { IDeveloperRepository } from '@interfaces/IDeveloperRespository'
import { IAdminRepository } from '@interfaces/IAdminRespository'
import { changePassword } from '@shared/types/userType'
import { Lender, LenderProfile } from '@entities/Leader'
import { ILenderRepository } from '@interfaces/ILenderRepository'

export class Agents {
  private readonly userRepository: IUserRepository
  private readonly adminRepository: IAdminRepository
  private readonly developerRepository: IDeveloperRepository
  private readonly lenderRepository: ILenderRepository
  private readonly client = new RedisClient()
  private readonly existingUsers: ExistingUsers
  private readonly developer: DeveloperUtils
  constructor(
    userRepository: IUserRepository,
    developerRepository: IDeveloperRepository,
    adminRepository: IAdminRepository,
    lenderRepository: ILenderRepository,
  ) {
    this.userRepository = userRepository
    this.developerRepository = developerRepository
    this.existingUsers = new ExistingUsers(this.userRepository)
    this.developer = new DeveloperUtils(this.developerRepository)
    this.lenderRepository = lenderRepository
    this.adminRepository = adminRepository
  }

  public async createAdmin(input: User): Promise<User> {
    await this.existingUsers.beforeCreateEmail(input.email)
    await this.existingUsers.beforeCreatePhone(input.phone_number)
    input.password = await this.userRepository.hashedPassword(input.password)
    const findRole = await this.userRepository.getRoleByName(Role.SUPER_ADMIN)
    const user = await this.userRepository.create(
      { ...input, role_id: findRole.id },
    )
    console.log(`Admin with id ${user.id} has been created`)
    return user
  }

  /*
    * @description This method is used to create an admin profile for the user
    * @param input - UserRegProfile
    * @param agent_id - string
    * @returns User
    */

  public async inviteAdmin(
    input: UserRegProfile,
    agent_id: string,
  ): Promise<User | any> {
    await Promise.all([
      this.existingUsers.beforeCreateEmail(input.email),
      this.existingUsers.beforeCreatePhone(input.phone_number),
    ])

    const [agentUser, findRole] = await Promise.all([
      this.userRepository.findById(agent_id),
      this.userRepository.getRoleByName(input.role),
    ])

    if (!findRole) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'Role not found')
    }

    console.log(agentUser.role)
    if (agentUser.role !==  Role.SUPER_ADMIN) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'You cannot create a super admin from an admin account',
      )
    }

    const defaultPassword = generateDefaultPassword()
    const password = await this.userRepository.hashedPassword(defaultPassword)

    const newUser = await this.userRepository.create(
      {
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone_number: input.phone_number,
        password,
        role_id: findRole.id,
        force_password_reset: true,
        is_default_password: true,
      },
    )
    const adminProfile = await this.adminRepository.createAdminProfile({
      street_address: input.street_address,
      city: input.city,
      state: input.state,
      landmark: input.landmark,
      country: input.country,
      user_id: newUser.id,
    })

    const token = generateInvitationToken()
    const encryptedtoken = await this.userRepository.hashedPassword(
      token.toString(),
    )
    const key = `${CacheEnumKeys.ACCEPT_INVITE_KEY}-${token}`
    const details = {
      user_id: newUser.id,
      token: encryptedtoken,
      type: OtpEnum.AGENT_EMAIL_VERIFICATION,
    }
    const oneDayInMs = 24 * 60 * 60 * 1000
    await this.client.setKey(key, details, oneDayInMs)
    const invitation_email = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`
    emailTemplates.InvitationEmail(input.email, `${input.first_name, input.last_name}`, invitation_email, input.role, defaultPassword)
    delete newUser.password
    return { ...newUser, ...adminProfile }
  }

  /*
    * @description This method is used to accept an invitation link sent to the user
    * @param invitation_token - string
    * @returns void
    */

  public async acceptInvitation(input: invitation): Promise<void> {
    const key = `${CacheEnumKeys.ACCEPT_INVITE_KEY}-${input.invite_code}`
    
    await this.client.checkAndClearCache(key)
    const details = await this.client.getKey(key)
    if(!details)  {
      throw new ApplicationCustomError(StatusCodes.BAD_REQUEST, `Invalid or expired invitation link`)
    }
    const { token, type, user_id } =
    typeof details === 'string' ? JSON.parse(details) : details
    const isValidToken = await this.userRepository.comparedPassword(input.invite_code, token)
    if(type !== OtpEnum.AGENT_EMAIL_VERIFICATION) {
      await this.client.deleteKey(key)
      throw new ApplicationCustomError(StatusCodes.BAD_REQUEST, `Sorry we can't complete this request`)
    }
    if(!isValidToken) {
      throw new ApplicationCustomError(StatusCodes.BAD_REQUEST, `Invalid or expired invitation link`)
    }
    await this.userRepository.update(user_id, {is_email_verified: true})
    await this.client.deleteKey(key)
  }

  public async resendInvitationEmail(
    user_id: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(user_id)
    if (user.is_email_verified) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'User already verified',
      )
    }
    const token = generateInvitationToken()
    const encryptedtoken = await this.userRepository.hashedPassword(
      token.toString(),
    )
    const key = `${CacheEnumKeys.ACCEPT_INVITE_KEY}-${token}`
    const details = {
      user_id: user.id,
      token: encryptedtoken,
      type: OtpEnum.AGENT_EMAIL_VERIFICATION,
    }
    const userRole = await this.userRepository.getRoleById(user.role_id)
    const defaultPassword = generateDefaultPassword()
    const password = await this.userRepository.hashedPassword(defaultPassword)
    const oneDayInMs = 24 * 60 * 60 * 1000
    await this.client.setKey(key, details, oneDayInMs)
    await this.userRepository.update(user.id, { password, is_default_password: true })
    const invitation_email = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`
    emailTemplates.InvitationEmail(user.email, `${user.first_name} ${user.last_name}`, invitation_email, userRole.name, defaultPassword)
  }

  /*
    * @description This method is used to invite sub admin to the platform
    * @param input - UserRegProfile
    * @param agent_id - string
    * @returns User
    */
   
  public async inviteSubAdmin(  input: UserRegProfile,
    agent_id: string,): Promise<User> {
      await Promise.all([
        this.existingUsers.beforeCreateEmail(input.email),
        this.existingUsers.beforeCreatePhone(input.phone_number),
      ])
  
      const [agentUser, findRole] = await Promise.all([
        this.userRepository.findById(agent_id),
        this.userRepository.getRoleByName(input.role),
      ])
  
      if (!findRole) {
        throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'Role not found')
      }
  
      if (agentUser.role_id === findRole.id && input.role === Role.SUPER_ADMIN) {
        throw new ApplicationCustomError(
          StatusCodes.BAD_REQUEST,
          'You cannot create a super admin from an admin account',
        )
      }
  
      const defaultPassword = generateDefaultPassword()
      const password = await this.userRepository.hashedPassword(defaultPassword)
      const newUser = await this.userRepository.create(
        {
          first_name: input.first_name,
          last_name: input.last_name,
          email: input.email,
          phone_number: input.phone_number,
          password,
          force_password_reset: true,
          role_id: findRole.id,
          is_default_password: true,
        },
      )
      const adminProfile = await this.adminRepository.createAdminProfile({
        street_address: input.street_address,
        city: input.city,
        state: input.state,
        landmark: input.landmark,
        country: input.country,
        user_id: newUser.id,
      })
  
      const token = generateInvitationToken()
      const encryptedtoken = await this.userRepository.hashedPassword(
        token.toString(),
      )
      const key = `${CacheEnumKeys.ACCEPT_INVITE_KEY}-${token}`
      const details = {
        user_id: newUser.id,
        token: encryptedtoken,
        type: OtpEnum.AGENT_EMAIL_VERIFICATION,
      }
      const oneDayInMs = 24 * 60 * 60 * 1000
      await this.client.setKey(key, details, oneDayInMs)
      const invitation_email = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`
      emailTemplates.InvitationEmail(input.email, `${input.first_name, input.last_name}`, invitation_email, input.role, defaultPassword)
      delete newUser.password
      return { ...newUser, ...adminProfile }
    
  }
 
  /*
    * @description This method is used to change the password of the user
    * @param input - changePassword
    * @param id - string
    * @returns void
    */
  public async changeInviteePassword(input: changePassword, id: string): Promise<void> {
    const user = await this.userRepository.findById(id)
    if(user.is_email_verified === false && user.force_password_reset === true) { 
      throw new ApplicationCustomError(
        StatusCodes.UNAUTHORIZED,
        'Invite has not been accepted.',
      )
    }
    if (input.oldPassword === input.newPassword) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        "New password can't be the same as old password",
      )
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
    const hashedNewPassword = await this.userRepository.hashedPassword(
      input.newPassword,
    )

    const updatePayload: Partial<User> = { password: hashedNewPassword }
    if (user.is_default_password) updatePayload.is_default_password = false
    if(user.force_password_reset) updatePayload.force_password_reset = false
    if(user.is_mfa_enabled) updatePayload.is_mfa_enabled = true

    await this.userRepository.update(id, updatePayload)
   
  }
  /*
    * @description This method is used to invite developers to the platform
    * @param input - DevelopeReg
    * @param agent_id - string
    * @returns DevelopeReg
    */
  public async inviteDevelopers(input: DevelopeReg, agent_id: string): Promise<DevelopeReg | any> {
    await Promise.all([
      this.existingUsers.beforeCreateEmail(input.email),
      this.existingUsers.beforeCreatePhone(input.phone_number),
      this.developer.findIfCompanyNameExist(input.company_name),
      this.developer.findIfCompanyRegistrationNumberExist(
        input.company_registration_number,
      ),
      this.developer.findIfCompanyEmailExist(input.company_email),
    ])
    const findRole =  await this.userRepository.getRoleByName(Role.DEVELOPER)

    if (!findRole) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'Role not found')
    }
    const defaultPassword = generateDefaultPassword()
    const password = await this.userRepository.hashedPassword(defaultPassword)
    let user = await this.userRepository.create(
      {
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone_number: input.phone_number,
        password,
        role_id: findRole.id,
        force_password_reset: true,
        is_default_password: true
      },
    )
    const developer = await this.developerRepository.createDeveloperProfile(
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
        documents: JSON.stringify(input.documents),
        developers_profile_id: user.id,
      }),
    )
    const token = generateInvitationToken()
    const encryptedtoken = await this.userRepository.hashedPassword(
      token.toString(),
    )
    const key = `${CacheEnumKeys.ACCEPT_INVITE_KEY}-${token}`
    const details = {
      user_id: user.id,
      token: encryptedtoken,
      type: OtpEnum.AGENT_EMAIL_VERIFICATION,
    }
    const oneDayInMs = 24 * 60 * 60 * 1000
    await this.client.setKey(key, details, oneDayInMs)
    const invitation_email = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`
    emailTemplates.InvitationEmail(input.email, `${input.first_name, input.last_name}`, invitation_email, Role.DEVELOPER, defaultPassword)
    delete user.password
    return { ...user, ...developer }
  }

  /*
    * @description This method is used to invite lenders to the platform 
    * @param input - LenderProfile
    * @param agent_id - string
    * @returns LenderProfile
    */

  public async inviteLender(input: LenderProfile, agent_id: string): Promise<LenderProfile> { 
           
    await Promise.all([
      this.existingUsers.beforeCreateEmail(input.email),
      this.existingUsers.beforeCreatePhone(input.phone_number),
    ])
    const findRole = await this.userRepository.getRoleByName(Role.LENDER)

    if (!findRole) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'Role not found')
    }

    const defaultPassword = generateDefaultPassword()
    const password = await this.userRepository.hashedPassword(defaultPassword)
    let user = await this.userRepository.create(
      {
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone_number: input.phone_number,
        password,
        role_id: findRole.id,
        force_password_reset: true,
        is_default_password: true
        
      },
    )
    const lenderProfile = await this.lenderRepository.createLender(
      new Lender({
        lender_name: input.lender_name,
        lender_type: input.lender_type,
        cac: input.cac,
        head_office_address: input.head_office_address,
        state: input.state,
        user_id: user.id,
      }),
    )
    const token = generateInvitationToken()
    const encryptedtoken = await this.userRepository.hashedPassword(
      token.toString(),
    )
    const key = `${CacheEnumKeys.ACCEPT_INVITE_KEY}-${token}`
    const details = {
      user_id: user.id,
      token: encryptedtoken,
      type: OtpEnum.AGENT_EMAIL_VERIFICATION,
    }
    const oneDayInMs = 24 * 60 * 60 * 1000
    await this.client.setKey(key, details, oneDayInMs)
    const invitation_email = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`
    emailTemplates.InvitationEmail(input.email, `${input.first_name, input.last_name}`, invitation_email, Role.LENDER, defaultPassword)
    delete user.password
    return { ...user, ...lenderProfile }
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
      { ...input, password, is_default_password: true },
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
