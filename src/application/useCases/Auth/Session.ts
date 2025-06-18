import { Organization } from '@entities/Organization'
import { UserOrganizationMember } from '@entities/UserOrganizationMember'
import { env } from '@infrastructure/config/env/env.config'
import { IOrganizationRepository } from '@interfaces/IOrganizationRepository'
import { ISessionRepository } from '@interfaces/ISessionRepository'
import { IUserRepository } from '@interfaces/IUserRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
// import { Hashing } from '@shared/utils/hashing'
import { SessionFilters } from '@validators/sessionValidator'
import { StatusCodes } from 'http-status-codes'

export class SessionService {
  // private readonly hashData = new Hashing()
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly userRepository: IUserRepository,
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async getById(id: string) {
    const session = await this.sessionRepository.getSessionByID(id)

    if (!session) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Session not found',
      )
    }

    const user = await this.userRepository.findById(session.id)

    let membership: UserOrganizationMember & {
      organization: Organization
      role: {
        id: string
        name: string
      }
    } = null

    if (user) {
      membership =
        await this.organizationRepository.getOrgenizationMemberByUserId(user.id)
    }

    return {
      ...session,
      user,
      membership,
    }
  }

  async getAll(filters: SessionFilters) {
    const sessionContents = await this.sessionRepository.getSessions(filters)

    sessionContents.result = await Promise.all(
      sessionContents.result.map(async (session) => {
        const user = await this.userRepository.findById(session.id)

        let membership: UserOrganizationMember & {
          organization: Organization
          role: {
            id: string
            name: string
          }
        } = null

        if (user) {
          membership =
            await this.organizationRepository.getOrgenizationMemberByUserId(
              user.id,
            )
        }

        return {
          ...session,
          user,
          membership,
        }
      }),
    )

    return sessionContents
  }

  async validateSession(sessionId: string, version: number) {
    const { session } = await this.sessionRepository.validateSession(
      sessionId,
      version,
      env.REMEMBER_ME_PERIOD,
    )

    if (!session) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Session not found',
      )
    }

    // let accessToken: string | null = null
    // let accessTokenExpiresAt: Date | null = null

    // let refreshToken: string | null = null
    // let refreshTokenExpiresAt: Date | null = null

    // if (canExtend) {
    //   this.hashData.accessCode(id, role)
    // }
  }
}
