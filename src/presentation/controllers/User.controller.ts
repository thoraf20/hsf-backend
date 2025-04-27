import { User } from '@domain/entities/User'
import { UserService } from '@application/useCases/User/User'
import { resetPassword } from '@shared/types/userType'
import { ApiResponse, createResponse } from '../response/responseType'
import { StatusCodes } from 'http-status-codes'
import { IAccountRepository } from '@interfaces/IAccountRepository'
import { Account } from '@entities/Account'

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly accountRepository: IAccountRepository,
  ) {}

  public async update(input: User, id: string): Promise<ApiResponse<any>> {
    await this.userService.update(input, id)
    return createResponse(StatusCodes.OK, 'User updated successfully', {})
  }

  public async verifyUpdate(otp: string): Promise<ApiResponse<any>> {
    await this.userService.verifyUpdate(otp)
    return createResponse(StatusCodes.OK, 'User updated successfully', {})
  }

  public async getUserById(id: string): Promise<ApiResponse<any>> {
    const user: User & { accounts?: Account[]; allow_email_change?: boolean } =
      await this.userService.getUserProfile(id)

    if (user) {
      user.accounts = await this.accountRepository.findByUserID(user.id)
      user.accounts.forEach((account) => {
        delete account.access_token
        delete account.refresh_token
        delete account.token_type
      })
    }

    user.allow_email_change = Boolean(
      user.password.length && user.password.length > 0,
    )

    delete user.password
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
