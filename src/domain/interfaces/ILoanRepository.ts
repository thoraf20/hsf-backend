import { Loan } from '@entities/Loans'
import { SeekPaginationResult } from '@shared/types/paginate'
import { LoanFilters } from '@validators/loanValidator'

export interface ILoanRepository {
  getLoanById(loan_id: string): Promise<Loan | null>
  createLoan(loan: Loan): Promise<Loan>
  updateLoan(loan_id: string, loan: Partial<Loan>): Promise<Loan | null>
  deleteLoan(loan_id: string): Promise<void>
  getLoans(filters: LoanFilters): Promise<SeekPaginationResult<Loan>>
}
