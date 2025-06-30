import { BaseEntity } from '..'

export class DocumentDeclineReason extends BaseEntity {
  document_decline_event_id: string
  decline_reason_id?: string
  reason?: string
  notes?: string
}
