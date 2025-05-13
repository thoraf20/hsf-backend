import { User } from '@domain/entities/User'
import { UserService } from '@application/useCases/User/User'
import { ApiResponse, createResponse } from '../response/responseType'
import { StatusCodes } from 'http-status-codes'
import { IAccountRepository } from '@interfaces/IAccountRepository'
import { Account } from '@entities/Account'
import { changePassword } from '@shared/types/userType'
import {
  ChangePasswordCompleteInput,
  ChangePasswordInput,
  UpdateProfileImageInput,
} from '@validators/userValidator'
import { MfaFlow } from '@domain/enums/userEum'

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly accountRepository: IAccountRepository,
  ) {}

  public async update(input: User, id: string): Promise<ApiResponse<any>> {
    await this.userService.update(input, id)
    return createResponse(StatusCodes.OK, 'User updated successfully', {})
  }

  public async updateProfileImage(id: string, input: UpdateProfileImageInput) {
    const updatedUser = await this.userService.updateProfileImage(id, input)

    return createResponse(
      StatusCodes.OK,
      'User profile image updated successfully',
      { id: updatedUser.id ?? updatedUser.user_id, image: updatedUser.image },
    )
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
    delete user.mfa_totp_secret
    return createResponse(StatusCodes.OK, 'User retrived successfully', user)
  }

  public async resetPassword(
    input: changePassword,
    id: string,
  ): Promise<ApiResponse<any>> {
    await this.userService.resetPassword(input, id)
    return createResponse(StatusCodes.OK, 'Password updated successfully', {})
  }

  public async changeUserPassword(id: string, input: ChangePasswordInput) {
    const data = await this.userService.initiateChangeUserPassword(id, input)

    let message = ''
    if (data?.mfa_required) {
      if (data.mfa_type === MfaFlow.EMAIL_OTP) {
        message =
          'Password change initiated. An OTP has been sent to your registered email to complete the process.'
      } else {
        // MfaFlow.TOTP
        message =
          'Password change initiated. Please enter the code from your authenticator app to complete the process.'
      }
    } else {
      message =
        'Password change process initiated. Please use the provided token to confirm the change.'
    }

    return createResponse(StatusCodes.OK, message, data)
  }

  async verifyChangePasswordMfa(
    userId: string,
    flow: MfaFlow,
    token: string,
    code: string,
  ) {
    const response = await this.userService.verifyChangePasswordMfa(
      userId,
      flow,
      token,
      code,
    )
    return createResponse(StatusCodes.OK, '', response)
  }

  async completeChangePassword(
    userId: string,
    input: ChangePasswordCompleteInput,
  ) {
    await this.userService.completeChangePassword(userId, input)
    return createResponse(StatusCodes.OK, 'Password changed successfully')
  }
}
