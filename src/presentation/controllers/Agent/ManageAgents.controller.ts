import { ApiResponse, createResponse } from "@presentation/response/responseType";
import { AgentsFilters } from "@shared/types/repoTypes";
import { ManageAgents } from "@use-cases/Agent/ManageAgents";
import { StatusCodes } from "http-status-codes";


export class ManageAgentController {
    constructor(private readonly manageAgent: ManageAgents) {}

    public async getAllAgents (filters?: AgentsFilters): Promise<ApiResponse<any>> {
        const agents = await this.manageAgent.getAllAgents(filters)
        return createResponse(
            StatusCodes.OK,
            'Success',
            agents
        )

    }

    public async getAgentById(agent_id: string): Promise<ApiResponse<any>> {
        const agent = await this.manageAgent.getAgentById(agent_id)
        return createResponse(
            StatusCodes.OK,
            'Success',
            agent
        )
    }
}