import { AgentsInformation } from "@entities/IManageAgents"
import { Role } from "@routes/index.t"
import { SeekPaginationResult } from "@shared/types/paginate"
import { AgentsFilters } from "@shared/types/repoTypes"

export interface IManageAgentsRespository  {
    getAllAgents(filters: AgentsFilters): Promise<SeekPaginationResult<AgentsInformation[]>>
    getAgentById(agent_id: string, role: Role): Promise<AgentsInformation>
    updateAgent(
        agent_id: string,
        data: Partial<AgentsInformation>,
    ): Promise<AgentsInformation>
}