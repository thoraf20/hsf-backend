import { LoanDeclineReason } from '@entities/DeclineRequest/LoanDeclineReason'

export interface ILoanDeclineReasonRepository {
  create(
    data: Omit<LoanDeclineReason, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<LoanDeclineReason>
  findById(id: string): Promise<LoanDeclineReason | undefined>
  findByLoanDeclineEventId(
    loanDeclineEventId: string,
  ): Promise<LoanDeclineReason[]>
  findByDeclineReasonId(declineReasonId: string): Promise<LoanDeclineReason[]>
  findByLoanDeclineEventIdAndDeclineReasonId(
    loanDeclineEventId: string,
    declineReasonId: string,
  ): Promise<LoanDeclineReason | undefined>
  delete(id: string): Promise<boolean>
}
