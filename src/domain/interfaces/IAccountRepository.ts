import { Account } from '@entities/Account'

export interface IAccountRepository {
  findByProviderID(provider_id: string): Promise<Account | null>
  findByUserID(user_id: string): Promise<Array<Account>>
  create(account: Partial<Account>): Promise<Account>
}
