import {
  ApiResponse,
  createResponse,
} from '@presentation/response/responseType'
import { ManageClientUseCase } from '@use-cases/Agent/ManageClient'
import {
  DisableCustomerInput,
  EnableCustomerInput,
} from '@validators/customerValidator'
import { UserFilter } from '@validators/userValidator'
import { StatusCodes } from 'http-status-codes'

export class ManageClientController {
  constructor(private readonly manageClients: ManageClientUseCase) {
    this.manageClients = manageClients
  }

  async getCustomers(filters: UserFilter): Promise<ApiResponse<any>> {
    const homeBuyerContents = await this.manageClients.getCustomers(filters)

    return createResponse(
      StatusCodes.OK,
      'Home buyers retrieved successfully',
      homeBuyerContents,
    )
  }

  async getClientMetaData(user_id: string): Promise<ApiResponse<any>> {
    const response = await this.manageClients.getClientMetaData(user_id)
    return createResponse(StatusCodes.OK, 'Success', response)
  }

  async disableCustomer(input: DisableCustomerInput) {
    const disabledUser = await this.manageClients.disableUser(input)
    return createResponse(
      StatusCodes.OK,
      'User account successfully disabled',
      disabledUser,
    )
  }

  async enableCustomer(input: EnableCustomerInput) {
    const enableUser = await this.manageClients.enableUser(input)

    return createResponse(
      StatusCodes.OK,
      'User account enabled successfully',
      enableUser,
    )
  }
}
