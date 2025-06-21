// HSF-Backend-New/src/presentation/controllers/User.controller.ts
import { User } from '@domain/entities/User'
import { UserService } from '@application/useCases/User/User'
import { ApiResponse, createResponse } from '../response/responseType'
import { StatusCodes } from 'http-status-codes'
import { IAccountRepository } from '@interfaces/IAccountRepository'
import { Account } from '@entities/Account'
import {
  ChangePasswordCompleteInput,
  ChangePasswordInput,
  UpdateProfileImageInput,
  UserActivityFilters,
  UserFilters,
} from '@validators/userValidator'
import { OrganizationRepository } from '@repositories/OrganizationRepository'
import { ManageOrganizations } from '@application/useCases/ManageOrganizations'
import { UserRepository } from '@repositories/user/UserRepository'
import { LenderRepository } from '@repositories/Agents/LenderRepository'
import { AddressRepository } from '@repositories/user/AddressRepository'
import { DeveloperRespository } from '@repositories/Agents/DeveloperRepository'
import { PropertyRepository } from '@repositories/property/PropertyRepository'
import { DocumentRepository } from '@repositories/property/DcoumentRepository'
import { IAddressRepository } from '@interfaces/IAddressRepository'
import { UserActivityLogRepository } from '@repositories/UserActivityLogRepository'

export class UserController {
  private manageOrganizations: ManageOrganizations
  constructor(
    private readonly userService: UserService,
    private readonly accountRepository: IAccountRepository,
    private readonly addressRepository: IAddressRepository,
  ) {
    this.manageOrganizations = new ManageOrganizations(
      new OrganizationRepository(),
      new UserRepository(),
      new LenderRepository(),
      new AddressRepository(),
      new DeveloperRespository(),
      new PropertyRepository(),
      new DocumentRepository(),
      new UserActivityLogRepository(),
    )
  }

  public async update(input: User, id: string): Promise<ApiResponse<any>> {
    const updatedUser = await this.userService.update(input, id)
    return createResponse(
      StatusCodes.OK,
      'User updated successfully',
      updatedUser,
    )
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
    // Fetch user profile
    const user: User & {
      accounts?: Account[]
      allow_email_change?: boolean
    } = await this.userService.getUserProfile(id)

    if (user) {
      user.accounts = await this.accountRepository.findByUserID(user.id)
      user.accounts.forEach((account) => {
        delete account.access_token
        delete account.refresh_token
        delete account.token_type
      })

      user.membership = await this.manageOrganizations.getOrganizationsForUser(
        user.id,
      )
    }

    const addresses = await this.addressRepository.getUserAddresses(user.id)

    user.allow_email_change = Boolean(user.password && user.password.length > 0)

    delete user.password
    delete user.mfa_totp_secret
    return createResponse(StatusCodes.OK, 'User retrieved successfully', {
      ...user,
      addresses,
    })
  }

  public async resetPassword(id: string): Promise<ApiResponse<any>> {
    const newCredentials = await this.userService.resetPassword(id)
    return createResponse(
      StatusCodes.OK,
      'Password updated successfully',
      newCredentials,
    )
  }

  public async changeUserPassword(id: string, input: ChangePasswordInput) {
    const data = await this.userService.initiateChangeUserPassword(id, input)

    let message = ''
    if (data?.mfa_required) {
      message =
        'Password change initiated. Please enter the code from your authenticator app to complete the process.'
    } else {
      message =
        'Password change process initiated. Please use the provided token to confirm the change.'
    }

    return createResponse(StatusCodes.OK, message, data)
  }

  async completeChangePassword(
    userId: string,
    input: ChangePasswordCompleteInput,
  ) {
    await this.userService.completeChangePassword(userId, input)
    return createResponse(StatusCodes.OK, 'Password changed successfully')
  }

  async getRoles() {
    const roles = await this.userService.getRoles()
    return createResponse(
      StatusCodes.OK,
      `User's role retrieved successfully`,
      {
        roles,
      },
    )
  }

  async getUsers(filters: UserFilters) {
    const userContents = await this.userService.getUsers(filters)
    return createResponse(
      StatusCodes.OK,
      'User retrieved successfully',
      userContents,
    )
  }

  async getUserActivites(filters: UserActivityFilters) {
    const activityContents = await this.userService.getUserActivites(filters)
    return createResponse(
      StatusCodes.OK,
      'User activities retrieved successfully',
      activityContents,
    )
  }

  async hsfResetUserPassword(userId: string) {}
}
