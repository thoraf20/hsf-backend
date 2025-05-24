import { User, UserClientView } from "@entities/User"
import db from "@infrastructure/database/knex"
import { IManageClientRepository } from "@interfaces/IManageClientRepository"
import { SeekPaginationResult } from "@shared/types/paginate"
import { UserFilter } from "@validators/userValidator"
import { Knex } from "knex"
import { applyPagination } from "@shared/utils/paginate"
type CountResult = { count: string | number }
export class ManageClientRepository implements IManageClientRepository {

      useFilters(
    query: Knex.QueryBuilder<User, User[]>,
    filters: UserFilter,
  ): Knex.QueryBuilder<User, User[]> {
    let q = query

    if (!filters || Object.keys(filters).length < 1) {
      return q
    }

    if (filters.first_name) {
      q = q.where('first_name', 'ilike', `%${filters.first_name}%`)
    }
    if (filters.last_name) {
      q = q.where('last_name', 'ilike', `%${filters.last_name}%`)
    }
    if (filters.email) {
      q = q.where('email', 'ilike', `%${filters.email}%`)
    }

    return q
  }

async getAllCustomers(filters: UserFilter | any): Promise<SeekPaginationResult<UserClientView>> {
    let baseQuery = db('users')
      .join('roles', 'users.role_id', 'roles.id')
      .select('users.*', 'roles.name as role')
      .where('roles.name', '=', 'Home Buyer')

    baseQuery = this.useFilters(baseQuery, filters)

    baseQuery = baseQuery.orderBy('users.created_at', 'asc')

    return applyPagination<UserClientView>(baseQuery, filters)


}



async getMetaData(user_id: string): Promise<{
  numbersOfPendingInspection: number
  numbersOfPendingTransaction: number
  numbersOfPendingPayments: number
  numbersOfPendingOfferLetters: number
}> {
  
  const application = await db('application')
    .select('*')
    .where('user_id', user_id)
    .first()


  const [transactions, payments] = await Promise.all([
    db('transactions')
      .count<{ count: string | number }[]>('* as count')
      .where('user_id', user_id)
      .andWhere('status', '=', 'pending'),

    db('payments')
      .count<{ count: string | number }[]>('* as count')
      .where('user_id', user_id)
      .andWhere('payment_status', '=', 'pending'),
  ])

 
  let inspections: CountResult[] = [{ count: 0 }]
  let offer_letters: CountResult[] = [{ count: 0 }]

  if (application) {
    [inspections, offer_letters] = await Promise.all([
      db('inspection')
        .count<{ count: string | number }[]>('* as count')
        .where('application_id', application.application_id)
        .andWhere('inspection_status', '=', 'pending'),

      db('offer_letter')
        .count<CountResult[]>('* as count')
        .where('user_id', application.user_id)
        .andWhere('offer_letter_status', '=', 'pending'),
    ])
  }


  const parseCount = (res: CountResult) =>
    typeof res.count === 'string' ? parseInt(res.count, 10) : res.count

  return {
    numbersOfPendingInspection: parseCount(inspections[0]),
    numbersOfPendingTransaction: parseCount(transactions[0]),
    numbersOfPendingPayments: parseCount(payments[0]),
    numbersOfPendingOfferLetters: parseCount(offer_letters[0]),
  }
}

}
