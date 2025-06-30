import { BaseEntity } from '..'

export class LoanDeclineEvent extends BaseEntity {
  declined_by_user_id: string
  loan_id: string
  declined_at: Date
  notes?: string
}
