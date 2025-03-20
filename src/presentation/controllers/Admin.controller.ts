import { ApiResponse, createResponse } from "../../presentation/response/responseType";
import { Admin } from "../../application/useCases/Admin";
import { User } from "../../domain/entities/User";
import { StatusCodes } from "http-status-codes";



export class AdminController { 


    constructor (private readonly adminService: Admin) {}
     
    public async inviteAgents (input: User): Promise<ApiResponse<any>> {
            const user = await this.adminService.inviteAgents(input)
             return  createResponse (
                StatusCodes.CREATED,
                `${user.role} account created successfully`,
                user
             )
    }
}
