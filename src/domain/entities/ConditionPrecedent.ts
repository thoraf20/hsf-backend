import { BaseEntity } from '.'

export class ConditionPrecedent extends BaseEntity {
  application_id: string
  status: string
  due_date: Date | null
  completed_date: Date | null
  notes: string | null
  documents_uploaded: boolean
  documents_status: string | null
  hsf_docs_reviewed?: boolean
  lender_docs_reviewed?: boolean

  constructor(data: Partial<ConditionPrecedent>) {
    super()
    Object.assign(this, data)
  }
}
