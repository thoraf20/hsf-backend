import { getUserClientView } from "@entities/User"
import { IManageClientRepository } from "@interfaces/IManageClientRepository"
import { UserFilter } from "@validators/userValidator"

export class ManageClientUseCase{
    constructor(private readonly manageClientRepository: IManageClientRepository) {
         this.manageClientRepository = manageClientRepository
    }
async getCustomers(filters: UserFilter) {
  const getAllCustomers = await this.manageClientRepository.getAllCustomers(filters)
  const customers = getAllCustomers.result.map(getUserClientView)

  return {
    customers
  }
}

 async getClientMetaData(user_id: string): Promise<any> {
      return await this.manageClientRepository.getMetaData(user_id)
 }
}