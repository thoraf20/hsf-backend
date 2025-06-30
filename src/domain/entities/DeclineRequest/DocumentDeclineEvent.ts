import { BaseEntity } from '..'

export class DocumentDeclineEvent extends BaseEntity {
  application_document_entry_id: string
  review_request_approval_id?: string
  declined_by_user_id?: string
  reason?: string
  notes?: string
  declined_at: Date
}
