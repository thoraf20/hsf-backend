import { BaseEntity } from '..'

export class LoanDeclineReason extends BaseEntity {
  loan_decline_event_id: string
  decline_reason_id?: string
  reason?: string
  notes?: string
}
