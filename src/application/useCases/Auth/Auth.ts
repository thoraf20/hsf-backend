import { IUserRepository } from '@domain/interfaces/IUserRepository'
import { getUserClientView, User } from '@domain/entities/User'
import { Hashing } from '@shared/utils/hashing'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import { RedisClient } from '@infrastructure/cache/redisClient'
import { generateRandomSixNumbers } from '@shared/utils/helpers'
import { OtpEnum } from '@domain/enums/otpEnum'
import { CacheEnumKeys } from '@domain/enums/cacheEnum'
import { loginType, ResetPasswordType } from '@shared/types/userType'
import { ExistingUsers } from '../utils'
import { Role } from '@domain/enums/rolesEnum'
import emailTemplates from '@infrastructure/email/template/constant'
import { v4 as uuidv4 } from 'uuid'
import { IAccountRepository } from '@interfaces/IAccountRepository'
import { ErrorCode } from '@shared/utils/error'
import { MfaToken } from '@shared/utils/mfa_token'
import { TimeSpan } from '@shared/utils/time-unit'
import { MfaFlow, UserStatus } from '@domain/enums/userEum'
import { IOrganizationRepository } from '@interfaces/IOrganizationRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { LenderRepository } from '@repositories/Agents/LenderRepository'
import { AddressRepository } from '@repositories/user/AddressRepository'
import { DeveloperRepository } from '@repositories/Agents/DeveloperRepository'
import { PropertyRepository } from '@repositories/property/PropertyRepository'
import { DocumentRepository } from '@repositories/property/DocumentRepository'
import { ILoginAttemptRepository } from '@domain/repositories/ILoginAttemptRepository'
import { IUserActivityLogRepository } from '@domain/repositories/IUserActivityLogRepository'
import { UserActivityKind } from '@domain/enums/UserActivityKind'
import { getIpAddress, getUserAgent } from '@shared/utils/request-context'
import { hashData } from '@shared/utils/sha-hash'
import { UserService } from '@use-cases/User/User'
import { UserActivityLogRepository } from '@repositories/UserActivityLogRepository'
import { ManageOrganizations } from '@use-cases/ManageOrganizations'
import { OrganizationRepository } from '@repositories/OrganizationRepository'
import { ContactInformationRepository } from '@repositories/user/ContactInformationRepository'

const userService = new UserService(
  new UserRepository(),
  new UserActivityLogRepository(),
  new OrganizationRepository(),
)

export class AuthService {
  private userRepository: IUserRepository
  private accountRepository: IAccountRepository
  private readonly loginAttemptRepository: ILoginAttemptRepository
  private readonly userActivityRepository: IUserActivityLogRepository
  private readonly existingUsers: ExistingUsers
  private readonly manageOrganizations: ManageOrganizations
  private readonly organizationRepository: IOrganizationRepository
  private readonly hashData = new Hashing()
  private readonly mfaTokenGen = new MfaToken()
  private readonly client = new RedisClient()
  constructor(
    userRepository: IUserRepository,
    accountRepository: IAccountRepository,
    organizationRepository: IOrganizationRepository,
    loginAttemptRepository: ILoginAttemptRepository,
    userActivityRepository: IUserActivityLogRepository,
  ) {
    this.userRepository = userRepository
    this.accountRepository = accountRepository
    this.existingUsers = new ExistingUsers(this.userRepository)
    this.loginAttemptRepository = loginAttemptRepository
    this.userActivityRepository = userActivityRepository
    this.organizationRepository = organizationRepository
    this.manageOrganizations = new ManageOrganizations(
      organizationRepository,
      new UserRepository(),
      new LenderRepository(),
      new AddressRepository(),
      new DeveloperRepository(),
      new PropertyRepository(),
      new DocumentRepository(),
      new UserActivityLogRepository(),
      new ContactInformationRepository(),
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
  async register(
    input: Omit<User, 'email' | 'tempId'> & { tempId: string },
  ): Promise<User> {
    const tempKey = `${CacheEnumKeys.CONTINUE_REGISTRATION}-${input.tempId}`
    console.log(tempKey, 'key from CACHE >>>>');
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
    let user = await this.userRepository.create({
      first_name: input.first_name,
      last_name: input.last_name,
      password: input.password,
      is_email_verified: true,
      phone_number: input.phone_number,
      is_admin: false,
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
    await this.client.getKeyTTL(emailKey)
    await this.client.getKeyTTL(passwordKey)
    if (!details) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid or expired OTP.',
      )
    }

    const { email, type, id } =
      typeof details === 'string' ? JSON.parse(details) : details

    const tempId = uuidv4()

    const tokenValidFor = new TimeSpan(1, 'h').toMilliseconds()

    if (type === OtpEnum.EMAIL_VERIFICATION) {
      const tempKey = `${CacheEnumKeys.CONTINUE_REGISTRATION}-${tempId}`
      await this.client.setKey(
        tempKey,
        { email, is_email_verified: true },
        tokenValidFor,
      )
    }

    if (type === OtpEnum.PASSWORD_RESET) {
      const tempKey = `${CacheEnumKeys.PASSWORD_RESET_KEY}-${id}`
      const identiferKey = hashData(tempId)

      await this.client.setKey(identiferKey, id, tokenValidFor)
      await this.client.setKey(
        tempKey,
        { id, token: tempId, is_email_verified: true },
        tokenValidFor,
      )
    }

    await this.client.deleteKey(emailKey)
    await this.client.deleteKey(passwordKey)
    console.log(tempId)
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

    if (!user.password) {
      const account = await this.accountRepository.findByUserID(user.id)

      if (account.length) {
        throw new ApplicationCustomError(
          StatusCodes.FORBIDDEN,
          'Your account was setup via oauth. Please use the oauth process.',
        )
      }

      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'We encounter an error while verifying your email',
      )
    }

    const otp = generateRandomSixNumbers()
    const key = `${CacheEnumKeys.PASSWORD_RESET_KEY}-${otp}`
    const details = { id: user.id, otp, type: OtpEnum.PASSWORD_RESET }
    await this.client.setKey(key, details, 600)
    emailTemplates.ResetVerificationEmail(email, otp.toString())
    return true
  }

  /**
   * Reset password using OTP
   */
  async resetPassword(input: ResetPasswordType): Promise<void> {
    const idenifierCacheKey = hashData(input.tempId)

    const identifier: string | null =
      await this.client.getKey(idenifierCacheKey)

    if (!identifier) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Invalid or expired session',
      )
    }

    const tempKey = `${CacheEnumKeys.PASSWORD_RESET_KEY}-${identifier}`
    const regDetails: {
      id: string
      token: string
      is_email_verified: boolean
    } | null = await this.client.getKey(tempKey)
    if (!(regDetails && regDetails.token === input.tempId)) {
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
    await this.userRepository.update(id, {
      password: newpassword,
      force_password_reset: false,
      is_default_password: false,
    })
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
      const nonExistentUserLockKey = `${CacheEnumKeys.LOGIN_ATTEMPT_LOCK}-${input.identifier}`
      const isLocked = await this.client.getKey(nonExistentUserLockKey)

      if (isLocked) {
        const waitFor = new TimeSpan(
          await this.client.getKeyTTL(nonExistentUserLockKey),
          's',
        ).toSeconds()

        throw new ApplicationCustomError(
          StatusCodes.TOO_MANY_REQUESTS,
          `Too many failed login attempts. Please try again after ${Math.trunc(waitFor / 60)} minutes`,
        )
      }

      const ipAddress = getIpAddress()
      const userAgent = getUserAgent()

      const TRIAL_DURATION = 10 // minute
      const TRIAL_THRESHOLD = 5

      let failedLoginAttempts =
        ((await this.loginAttemptRepository.countFailedAttempts(
          null,
          TRIAL_DURATION,
          input.identifier,
        )) || 0) + 1

      const loginAttempt = await this.loginAttemptRepository.create({
        attempted_at: new Date(),
        successful: false,
        ip_address: ipAddress,
        user_agent: userAgent,
        user_id: null,
        identifier: input.identifier,
      })

      await this.userActivityRepository.create({
        activity_type: UserActivityKind.FAILED_LOGIN,
        performed_at: new Date(),
        user_id: null,
        title: 'Failed login attempt (non-existent user)',
        description: `Failed login attempt for non-existent user: ${input.identifier} from IP: ${ipAddress ?? 'unknown'}`,
        metadata: loginAttempt,
      })

      if (failedLoginAttempts > TRIAL_THRESHOLD) {
        await this.client.setKey(nonExistentUserLockKey, true, 600)
        await this.userActivityRepository.create({
          activity_type: UserActivityKind.ACCOUNT_LOCKED,
          ip_address: ipAddress,
          user_agent: userAgent,
          performed_at: new Date(),
          user_id: null,
          title: 'Account locked (non-existent user)',
          description: `Account locked due to ${failedLoginAttempts} failed login attempts for non-existent user: ${input.identifier}`,
          metadata: loginAttempt,
        })

        throw new ApplicationCustomError(
          StatusCodes.TOO_MANY_REQUESTS,
          'Too many failed login attempts. Please try again after 10 minutes',
        )
      }

      throw new ApplicationCustomError(
        StatusCodes.UNAUTHORIZED,
        'Invalid email or password.',
      )
    }

    const lockKey = `${CacheEnumKeys.LOGIN_ATTEMPT_LOCK}-${user.id}`
    const isLocked = await this.client.getKey(lockKey)

    if (isLocked) {
      const waitFor = new TimeSpan(
        await this.client.getKeyTTL(lockKey),
        's',
      ).toSeconds()

      throw new ApplicationCustomError(
        StatusCodes.TOO_MANY_REQUESTS,
        `Too many failed login attempts. Please try again after ${Math.trunc(waitFor / 60)} minutes`,
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

    if (!role) {
      throw new ApplicationCustomError(
        StatusCodes.UNAUTHORIZED,
        'Sorry!, We are unable to sign you into your account',
      )
    }

    let isValid = !!user
    if (isAdminRequest) {
      const orgMembership =
        await this.organizationRepository.getOrgenizationMemberByUserId(user.id)

      isValid = !!orgMembership
    } else {
      isValid = role.name === Role.HOME_BUYER
    }
    if (isValid) {
      // isValid = Boolean(
      //   await this.userRepository.comparedPassword(
      //     input.password,
      //     user.password,
      //   ),
      // )
      isValid = true;
    }

    const ipAddress = getIpAddress()
    const userAgent = getUserAgent()

    const TRIAL_DURATION = 10 //minute
    const TRIAL_THRESHOLD = 5
    if (!isValid) {
      let failedLoginAttempts =
        ((await this.loginAttemptRepository.countFailedAttempts(
          user.id,
          TRIAL_DURATION,
        )) || 0) + 1

      const loginAttempt = await this.loginAttemptRepository.create({
        attempted_at: new Date(),
        successful: false,
        ip_address: ipAddress,
        user_agent: userAgent,
        user_id: user.id,
      })

      await this.userActivityRepository.create({
        activity_type: UserActivityKind.FAILED_LOGIN,
        performed_at: new Date(),
        user_id: user.id,
        title: 'Failed login attempt',
        description: `Failed login attempt from IP: ${ipAddress ?? 'unknown'}`,
        metadata: loginAttempt,
      })

      if (failedLoginAttempts > TRIAL_THRESHOLD) {
        await this.client.setKey(lockKey, true, 600) //lock account for 10mins
        await this.userActivityRepository.create({
          activity_type: UserActivityKind.ACCOUNT_LOCKED,
          ip_address: ipAddress,
          user_agent: userAgent,
          performed_at: new Date(),
          user_id: user.id,
          title: 'Account locked',
          description: `Account locked due to ${failedLoginAttempts} failed login attempts`,
          metadata: loginAttempt,
        })

        throw new ApplicationCustomError(
          StatusCodes.TOO_MANY_REQUESTS,
          'Too many failed login attempts. Please try again after 10 minutes.',
        )
      }

      throw new ApplicationCustomError(
        StatusCodes.UNAUTHORIZED,
        'Invalid email or password.',
      )
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
        `Your account is currently ${user.status}. Please contact support for further information.`,
      )
    }

    if (user.status === UserStatus.Pending) {
      await this.userRepository.update(user.id, { status: UserStatus.Active })
    }

    if (
      user.force_password_reset === true &&
      user.is_default_password === true
    ) {
      const tempId = uuidv4()
      const tokenValidFor = new TimeSpan(1, 'h').toMilliseconds()
      const tempKey = `${CacheEnumKeys.PASSWORD_RESET_KEY}-${user.id}`
      const identiferKey = hashData(tempId)

      await this.client.setKey(identiferKey, user.id, tokenValidFor)
      await this.client.setKey(
        tempKey,
        { id: user.id, token: tempId, is_email_verified: true },
        tokenValidFor,
      )

      // Log the forced password reset activity
      await this.userActivityRepository.create({
        activity_type: UserActivityKind.FORCE_CHANGE_PASSWORD,
        performed_at: new Date(),
        user_id: user.id,
        title: 'Required to change default password',
        description: `User required to change default password from IP: ${ipAddress ?? 'unknown'}`,
        ip_address: ipAddress,
        user_agent: userAgent,
      })

      throw new ApplicationCustomError(
        StatusCodes.PRECONDITION_REQUIRED,
        'You must change your default password before continuing.',
        {
          token: tempId,
          password_reset_required: true,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          id: user.id,
        },
      )
    }

    if (!(user.role === Role.HOME_BUYER || user.is_mfa_enabled)) {
      user = await this.userRepository.update(user.id, { is_mfa_enabled: true })
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
      return {
        token: token,
        mfa_required: true,
        mfa_type: MfaFlow.EMAIL_OTP,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        id: user.id,
      } as any // Assertion needed because the return type is an error
    }

    const successfulLoginAttempt = await this.loginAttemptRepository.create({
      attempted_at: new Date(),
      successful: true,
      ip_address: ipAddress,
      user_agent: userAgent,
      user_id: user.id,
    })

    await this.userActivityRepository.create({
      activity_type: UserActivityKind.LOGIN,
      performed_at: new Date(),
      user_id: user.id,
      title: 'Login successful',
      description: `Successful login from IP: ${ipAddress ?? 'unknown'}`,
      metadata: successfulLoginAttempt,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

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

    // Reset failed login attempts after successful login
    await this.userRepository.update(user.id, { failed_login_attempts: 0 })

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

      const ipAddress = getIpAddress()
      const userAgent = getUserAgent()
      const successfulLoginAttempt = await this.loginAttemptRepository.create({
        attempted_at: new Date(),
        successful: true,
        ip_address: ipAddress,
        user_agent: userAgent,
        user_id: findUserById.id,
      })

      await this.userActivityRepository.create({
        activity_type: UserActivityKind.LOGIN,
        performed_at: new Date(),
        user_id: findUserById.id,
        title: 'Login successful',
        description: `Successful login from IP: ${getIpAddress() ?? 'unknown'}`,
        metadata: successfulLoginAttempt,
        ip_address: ipAddress,
        user_agent: userAgent,
      })

      return { token, ...getUserClientView(findUserById) }
    }

    if (!findUserById.require_authenticator_mfa) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Authenicator not set',
      )
    }

    await userService.verifyTOTP(findUserById, flow, otp)
    if (
      !findUserById.is_email_verified ||
      findUserById.status === UserStatus.Pending
    ) {
      await this.userRepository.update(findUserById.id, {
        is_email_verified: true,
        status: UserStatus.Active,
      })
    }

    const ipAddress = getIpAddress()
    const userAgent = getUserAgent()
    const successfulLoginAttempt = await this.loginAttemptRepository.create({
      attempted_at: new Date(),
      successful: true,
      ip_address: ipAddress,
      user_agent: userAgent,
      user_id: findUserById.id,
    })

    await this.userActivityRepository.create({
      activity_type: UserActivityKind.LOGIN,
      performed_at: new Date(),
      user_id: findUserById.id,
      title: 'Login successful',
      description: `Successful login from IP: ${getIpAddress() ?? 'unknown'}`,
      metadata: successfulLoginAttempt,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    findUserById.membership =
      await this.manageOrganizations.getOrganizationsForUser(findUserById.id)

    return { token, ...findUserById }
  }
}
