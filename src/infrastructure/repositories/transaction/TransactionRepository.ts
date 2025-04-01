import { Transaction } from '@domain/entities/Transaction'
import { ITransaction } from '@domain/interfaces/ITransactionRepository'
import db from '@infrastructure/database/knex'

export class TransactionRepository implements ITransaction {
  public async saveTransaction(input: Transaction): Promise<Transaction> {
    const [transaction] = await db('transactions').insert(input).returning('*')
    return new Transaction(transaction)
  }
}
