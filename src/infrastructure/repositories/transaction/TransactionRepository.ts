import { Transaction } from '@domain/entities/Transaction'
import { ITransaction } from '@domain/interfaces/ITransactionRepository'
import { User } from '@entities/User'
import db from '@infrastructure/database/knex'
import { SeekPaginationOption, SeekPaginationResult } from '@shared/types/paginate'

export class TransactionRepository implements ITransaction {
  public async saveTransaction(input: Transaction): Promise<Transaction> {
    const [transaction] = await db('transactions').insert(input).returning('*')
    return new Transaction(transaction)
  }

  public async getTransactionById(id: string): Promise<Transaction> {
    const [transaction] = await db('transactions').where({ id }).first('*')
    return new Transaction(transaction)
  }

  public async getAlltransactionbyIds(ids : string[], paginate?: SeekPaginationOption,): Promise<Promise<SeekPaginationResult<Transaction>>> {
    var query = db('transactions');

    for (var i in ids){
      if (+i > 0){
        query = query.or.where({property_id : ids[i]});
      }else {
        query = query.where({property_id : ids[i]});
      }
    }

    if (paginate) {
      const offset = (paginate.page_number - 1) * paginate.result_per_page
      query = query.limit(paginate.result_per_page).offset(offset)
    }


    const results = (await query.select("*")).map(t => new Transaction(t));

    return new SeekPaginationResult<Transaction>({
      result: results,
      page: paginate?.page_number || 1,
      result_per_page: paginate?.result_per_page || results.length,
    })
  }


  public async fetchUserFromTransactionByPaymentIds(ids : string[], paginate?: SeekPaginationOption,): Promise<Promise<SeekPaginationResult<User>>> {
    let query = db('users')
      .join('transactions', 'users.id', 'transactions.user_id')
      .whereIn('transactions.property_id', ids)
      .distinct(
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.phone_number',
        'users.image',
        'users.profile',
      );

    if (paginate) {
      const offset = (paginate.page_number - 1) * paginate.result_per_page
      query = query.limit(paginate.result_per_page).offset(offset)
    }

    const results = (await query).map((u) => new User(u))

    return new SeekPaginationResult<User>({
      result: results,
      page: paginate?.page_number || 1,
      result_per_page: paginate?.result_per_page || results.length,
    })
  }
}
