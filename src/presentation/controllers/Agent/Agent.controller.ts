import {
  ApiResponse,
  createResponse,
} from '@presentation/response/responseType'
import { Agents } from '@use-cases/Agent/agent'
import { invitation, User, UserRegProfile } from '@domain/entities/User'
import { StatusCodes } from 'http-status-codes'
import { changePassword } from '@shared/types/userType'
import { DevelopeReg } from '@entities/Developer'
import { LenderProfile } from '@entities/Leader'


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

  public async inviteAdmin(input: UserRegProfile, agent_id: string): Promise<ApiResponse<any>> { 
    const user = await this.adminService.inviteAdmin(input, agent_id)
    return createResponse(
      StatusCodes.CREATED,
      `${user.role} account created successfully`,
      user,
    )
  }

  public async acceptInvite(input: invitation): Promise<ApiResponse<any>> { 
     await this.adminService.acceptInvitation(input)
    return createResponse(
      StatusCodes.CREATED,
      `Invitation accepted successfully`,
     {},
    )
  }

  public async inviteSubAdmin(input: UserRegProfile, agent_id: string): Promise<ApiResponse<any>> {
    const user = await this.adminService.inviteSubAdmin(input, agent_id)
    return createResponse(
      StatusCodes.CREATED,
      `${user.role} account created successfully`,
      user,
    )
  }

  public async changeInvitationDefaultPassword(input: changePassword, id: string): Promise<ApiResponse<any>> { 
     await this.adminService.changeInviteePassword(input, id)
    return createResponse(
      StatusCodes.CREATED,
      `Password changed successfully`,
      {},
    )
  }

  public async resendInvitation(user_id: string): Promise<ApiResponse<any>> {
    await this.adminService.resendInvitationEmail(user_id)
    return createResponse(
      StatusCodes.CREATED,
      `Invitation resent successfully`,
      {},
    )
  }

  public async inviteDeveloper(input: DevelopeReg, agent_id: string): Promise<ApiResponse<any>> {
    const user = await this.adminService.inviteDevelopers(input, agent_id)
    return createResponse(
      StatusCodes.CREATED,
      `${user.role} account created successfully`,
      user,
    )
  }

  public async inviteLender(input: LenderProfile, agent_id: string): Promise<ApiResponse<any>> { 
    const user = await this.adminService.inviteLender(input, agent_id)
    return createResponse(
      StatusCodes.CREATED,
      `${user.role} account created successfully`,
      user,
    )
  }
}


   
