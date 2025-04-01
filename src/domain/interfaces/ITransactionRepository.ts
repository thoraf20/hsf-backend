import { Transaction } from '@domain/entities/Transaction'
import { User } from '@entities/User'
import { SeekPaginationOption, SeekPaginationResult } from '@shared/types/paginate'

export interface ITransaction {
  saveTransaction(input: Transaction): Promise<Transaction>

  getTransactionById(id: string): Promise<Transaction>

  getAlltransactionbyIds(ids : string[], paginate?: SeekPaginationOption,): Promise<Promise<SeekPaginationResult<Transaction>>>

  fetchUserFromTransactionByPaymentIds(ids : string[], paginate?: SeekPaginationOption,): Promise<Promise<SeekPaginationResult<User>>>
}
