import { AgentsInformation } from '@entities/IManageAgents'
import { IManageAgentsRespository } from '@interfaces/IManageAgentsRespository'
import { IUserRepository } from '@interfaces/IUserRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { OrganizationRepository } from '@repositories/OrganizationRepository'
import { Role } from '@routes/index.t'
import { SeekPaginationResult } from '@shared/types/paginate'
import { AgentsFilters } from '@shared/types/repoTypes'
import { generateRandomPassword } from '@shared/utils/helpers'
import { StatusCodes } from 'http-status-codes'
import template from '@infrastructure/email/template/constant'
import { getUserClientView } from '@entities/User'

export class ManageAgents {
  private readonly manageAgentsRepository: IManageAgentsRespository
  private readonly userRepository: IUserRepository
  private readonly organizationRepository: OrganizationRepository

  constructor(
    manageAgentsRepository: IManageAgentsRespository,
    userRepository: IUserRepository,
    organizationRepository: OrganizationRepository,
  ) {
    this.manageAgentsRepository = manageAgentsRepository
    this.userRepository = userRepository
    this.organizationRepository = organizationRepository
  }
  public async getAllAgents(
    filters?: AgentsFilters,
  ): Promise<SeekPaginationResult<AgentsInformation[]>> {
    return await this.manageAgentsRepository.getAllAgents(filters)
  }

  public async getAgentById(agent_id: string): Promise<any> {
    const getUser = await this.userRepository.findById(agent_id)
    if (!getUser) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'agent not found')
    }
    const getUserRole = await this.userRepository.getRoleById(getUser.role_id)
    return await this.manageAgentsRepository.getAgentById(
      agent_id,
      getUserRole.name as Role,
    )
  }

  public async resetOrganizationAgentPassword(
    organization_id: string,
    agent_id: string,
  ): Promise<void> {
    const getOrganization =
      await this.organizationRepository.getOrganizationById(organization_id)
    if (!getOrganization) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Organization not found',
      )
    }
    if (getOrganization.id !== organization_id) {
      throw new ApplicationCustomError(
        StatusCodes.UNAUTHORIZED,
        'You are not authorized to reset this agent password',
      )
    }
    const getAgent = getUserClientView(
      await this.userRepository.findById(agent_id),
    )
    if (!getAgent) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'Agent not found')
    }
    const defaultPassword = generateRandomPassword()
    const hashedPassword =
      await this.userRepository.hashedPassword(defaultPassword)
    await this.userRepository.update(agent_id, {
      password: hashedPassword,
      is_default_password: true,
      force_password_reset: true,
    })
    const url = `${process.env.FRONTEND_URL}/auth/login`
    template.passwordResetForOrganization(
      getAgent.email,
      `${getAgent.first_name} ${getAgent.last_name}`,
      defaultPassword,
      url,
      getOrganization.name,
    )
  }
}
