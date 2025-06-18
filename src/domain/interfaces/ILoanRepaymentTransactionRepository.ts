import { LoanRepaymentTransaction } from '@entities/Loans'

export interface ILoanRepaymentTransactionRepository {
  getLoanRepaymentTransactionById(
    repayment_transaction_id: string,
  ): Promise<LoanRepaymentTransaction | null>

  getLoanRepaymentTransactionRepaymentId(
    repayment_id: string,
  ): Promise<LoanRepaymentTransaction | null>
  createLoanRepaymentTransaction(
    loanRepaymentTransaction: LoanRepaymentTransaction,
  ): Promise<LoanRepaymentTransaction>
  updateLoanRepaymentTransaction(
    repayment_transaction_id: string,
    loanRepaymentTransaction: Partial<LoanRepaymentTransaction>,
  ): Promise<LoanRepaymentTransaction | null>
  deleteLoanRepaymentTransaction(
    repayment_transaction_id: string,
  ): Promise<void>
}
