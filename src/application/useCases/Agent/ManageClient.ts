import { UserStatus } from '@domain/enums/userEum'
import { getUserClientView } from '@entities/User'
import { IManageClientRepository } from '@interfaces/IManageClientRepository'
import { IUserRepository } from '@interfaces/IUserRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import {
  DisableCustomerInput,
  EnableCustomerInput,
} from '@validators/customerValidator'
import { UserFilter } from '@validators/userValidator'
import { Stats } from 'fs'
import { StatusCodes } from 'http-status-codes'

export class ManageClientUseCase {
  constructor(
    private readonly manageClientRepository: IManageClientRepository,
    private readonly userRepository: IUserRepository,
  ) {
    this.manageClientRepository = manageClientRepository
  }

  async getCustomers(filters: UserFilter) {
    const getAllCustomers =
      await this.manageClientRepository.getAllCustomers(filters)
    getAllCustomers.result = getAllCustomers.result.map(getUserClientView)

    return getAllCustomers
  }

  async getClientMetaData(user_id: string): Promise<any> {
    return await this.manageClientRepository.getMetaData(user_id)
  }

  async disableUser(input: DisableCustomerInput) {
    const existingUser = await this.userRepository.findById(input.user_id)

    if (!existingUser) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found')
    }

    if (
      existingUser.status === UserStatus.Banned ||
      existingUser.status === UserStatus.Suspended
    ) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        `User account already ${existingUser.status}`,
      )
    }

    if (existingUser.status === UserStatus.Deleted) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'This user account is marked as deleted',
      )
    }

    await this.userRepository.update(input.user_id, { status: input.status })

    return getUserClientView(existingUser)
  }

  async enableUser(input: EnableCustomerInput) {
    const existingUser = await this.userRepository.findById(input.user_id)

    if (!existingUser) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'User not found')
    }

    if (
      !(
        existingUser.status === UserStatus.Banned ||
        existingUser.status === UserStatus.Suspended
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        `User account not under suspension or banned`,
      )
    }

    await this.userRepository.update(input.user_id, {
      status: UserStatus.Active,
    })

    return getUserClientView(existingUser)
  }
}
