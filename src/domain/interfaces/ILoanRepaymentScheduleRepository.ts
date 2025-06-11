import { LoanRepaymentSchedule } from '@entities/Loans'

export interface ILoanRepaymentScheduleRepository {
  getLoanRepaymentScheduleByLoanId(
    loan_id: string,
  ): Promise<LoanRepaymentSchedule[]>

  getLoanRepaymentScheduleById(
    schedule_id: string,
  ): Promise<LoanRepaymentSchedule | null>
  createLoanRepaymentSchedule(
    loanRepaymentSchedule: LoanRepaymentSchedule,
  ): Promise<LoanRepaymentSchedule>
  updateLoanRepaymentSchedule(
    schedule_id: string,
    loanRepaymentSchedule: Partial<LoanRepaymentSchedule>,
  ): Promise<LoanRepaymentSchedule | null>
  deleteLoanRepaymentSchedule(schedule_id: string): Promise<void>
}
