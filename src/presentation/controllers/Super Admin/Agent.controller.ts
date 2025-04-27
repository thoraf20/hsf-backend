import {
  ApiResponse,
  createResponse,
} from '@presentation/response/responseType'
import { Agents } from '@use-cases/Super Admin/agent'
import { User } from '@domain/entities/User'
import { StatusCodes } from 'http-status-codes'

export class AgentsController {
  constructor(private readonly adminService: Agents) {}

  public async inviteAgents(input: User): Promise<ApiResponse<any>> {
    const user = await this.adminService.inviteAgents(input)
    return createResponse(
      StatusCodes.CREATED,
      `${user.role} account created successfully`,
      user,
    )
  }
}
