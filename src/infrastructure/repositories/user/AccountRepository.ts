import { Account } from '@entities/Account'
import db from '@infrastructure/database/knex'
import { IAccountRepository } from '@interfaces/IAccountRepository'

export class AccountRepository implements IAccountRepository {
  private readonly qb = () => db<Account>('accounts')
  constructor() {}

  async findByProviderID(provider_id: string): Promise<Account | null> {
    const account = await this.qb()
      .select()
      .where({ provider_account_id: provider_id })
      .first()
    return account ?? null
  }

  findByUserID(user_id: string): Promise<Array<Account>> {
    return this.qb().select().where({ user_id })
  }

  async create(account: Partial<Account>): Promise<Account> {
    const [newAccount] = await this.qb().insert(account).returning('*')
    return newAccount
  }
}
