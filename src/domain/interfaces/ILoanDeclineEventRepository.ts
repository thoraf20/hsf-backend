import { LoanDeclineEvent } from '@entities/DeclineRequest/LoanDeclineEvent'

export interface ILoanDeclineEventRepository {
  create(
    data: Omit<
      LoanDeclineEvent,
      'id' | 'created_at' | 'updated_at' | 'declined_at'
    >,
  ): Promise<LoanDeclineEvent>
  findById(id: string): Promise<LoanDeclineEvent | undefined>
  findByLoanId(loanId: string): Promise<LoanDeclineEvent[]>
  update(
    id: string,
    data: Partial<
      Omit<LoanDeclineEvent, 'id' | 'created_at' | 'updated_at' | 'declined_at'>
    >,
  ): Promise<LoanDeclineEvent | undefined>
  delete(id: string): Promise<boolean>
}
