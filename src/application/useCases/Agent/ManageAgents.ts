import { AgentsInformation } from "@entities/IManageAgents";
import { IManageAgentsRespository } from "@interfaces/IManageAgentsRespository";
import { IUserRepository } from "@interfaces/IUserRepository";
import { ApplicationCustomError } from "@middleware/errors/customError";
import { SeekPaginationResult } from "@shared/types/paginate";
import { AgentsFilters } from "@shared/types/repoTypes";
import { StatusCodes } from "http-status-codes";


export class ManageAgents {
  private readonly manageAgentsRepository: IManageAgentsRespository
  private readonly userRepository: IUserRepository
  constructor(manageAgentsRepository: IManageAgentsRespository, userRepository: IUserRepository) { 
    this.manageAgentsRepository = manageAgentsRepository
    this.userRepository = userRepository
  }
  public async getAllAgents(filters?: AgentsFilters): Promise<SeekPaginationResult<AgentsInformation[]>> {
    return await this.manageAgentsRepository.getAllAgents(filters)
  }
  
    public async getAgentById(agent_id: string): Promise<any> {
       const getUser = await this.userRepository.findById(agent_id)
       if(!getUser) {
        throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'agent not found')
       }
       const getUserRole = await this.userRepository.getRoleById(getUser.role_id)
        return await this.manageAgentsRepository.getAgentById(agent_id, getUserRole.name)
    }
    
}
