import { User } from "../../domain/entities/User"
import { UserService } from "../../application/useCases/User"
import { resetPassword } from "../../domain/types/userType"
import { ApiResponse, createResponse } from "../response/responseType";
import { StatusCodes } from "http-status-codes";

export class UserController {
    constructor(private readonly userService: UserService) {}

    public async update(input: User, id: string): Promise<ApiResponse<any>> {
        await this.userService.update(input, id)
        return createResponse(
            StatusCodes.OK,
            'User updated successfully',
            {}
        )
    }

    public async verifyUpdate(otp: string): Promise<ApiResponse<any>> {
        await this.userService.verifyUpdate(otp)
        return createResponse(
            StatusCodes.OK,
            'User updated successfully',
            {}
        )
    }

    public async resetPassword(input: resetPassword, id: string): Promise<ApiResponse<any>> {
        await this.userService.resetPassword(input, id)
        return createResponse(
            StatusCodes.OK,
            'Password updated successfully',
            {}
        )
    }

    public async enableMfa(id: string): Promise<ApiResponse<any>> {
        await this.userService.EnableAndDisableMfa(id)
        return createResponse(
            StatusCodes.OK,
            'MFA updated successfully',
            {}
        )
    }
}