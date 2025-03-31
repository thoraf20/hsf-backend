import { Transaction } from '@domain/entities/Transaction'

export interface ITransaction {
  saveTransaction(input: Transaction): Promise<Transaction>
}
