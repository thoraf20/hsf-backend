import { User } from '../../domain/entities/User'
import { UserService } from '../../application/useCases/User/User'
import { resetPassword } from '../../shared/types/userType'
import { ApiResponse, createResponse } from '../response/responseType'
import { StatusCodes } from 'http-status-codes'

export class UserController {
  constructor(private readonly userService: UserService) {}

  public async update(input: User, id: string): Promise<ApiResponse<any>> {
    await this.userService.update(input, id)
    return createResponse(StatusCodes.OK, 'User updated successfully', {})
  }

  public async verifyUpdate(otp: string): Promise<ApiResponse<any>> {
    await this.userService.verifyUpdate(otp)
    return createResponse(StatusCodes.OK, 'User updated successfully', {})
  }

  public async getUserById(id: string): Promise<ApiResponse<any>> {
    const user = await this.userService.getUserProfile(id)
    return createResponse(StatusCodes.OK, 'User retrived successfully', user)
  }

  public async resetPassword(
    input: resetPassword,
    id: string,
  ): Promise<ApiResponse<any>> {
    await this.userService.resetPassword(input, id)
    return createResponse(StatusCodes.OK, 'Password updated successfully', {})
  }

  public async enableMfa(id: string): Promise<ApiResponse<any>> {
    await this.userService.EnableAndDisableMfa(id)
    return createResponse(StatusCodes.OK, 'MFA updated successfully', {})
  }
}
