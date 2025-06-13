import { LoanRepaymentTransaction } from '@entities/Loans'
import db from '@infrastructure/database/knex'
import { ILoanRepaymentTransactionRepository } from '@interfaces/ILoanRepaymentTransactionRepository'

export class LoanRepaymentTransactionRepository
  implements ILoanRepaymentTransactionRepository
{
  private readonly tableName = 'loan_repayment_transactions'

  async getLoanRepaymentTransactionById(
    repayment_transaction_id: string,
  ): Promise<LoanRepaymentTransaction | null> {
    const transaction = await db(this.tableName)
      .where({ repayment_transaction_id })
      .first()
    return transaction ? new LoanRepaymentTransaction(transaction) : null
  }

  async getLoanRepaymentTransactionRepaymentId(
    repayment_id: string,
  ): Promise<LoanRepaymentTransaction | null> {
    const transaction = await db<LoanRepaymentTransaction>(this.tableName)
      .where({ schedule_id: repayment_id })
      .first()
    return transaction
  }

  async createLoanRepaymentTransaction(
    loanRepaymentTransaction: LoanRepaymentTransaction,
  ): Promise<LoanRepaymentTransaction> {
    const [newTransaction] = await db(this.tableName)
      .insert(loanRepaymentTransaction)
      .returning('*')
    return new LoanRepaymentTransaction(newTransaction)
  }

  async updateLoanRepaymentTransaction(
    repayment_transaction_id: string,
    loanRepaymentTransaction: Partial<LoanRepaymentTransaction>,
  ): Promise<LoanRepaymentTransaction | null> {
    await db(this.tableName)
      .where({ repayment_transaction_id })
      .update(loanRepaymentTransaction)
    const updatedTransaction = await this.getLoanRepaymentTransactionById(
      repayment_transaction_id,
    )
    return updatedTransaction
  }

  async deleteLoanRepaymentTransaction(
    repayment_transaction_id: string,
  ): Promise<void> {
    await db(this.tableName).where({ repayment_transaction_id }).del()
  }
}
