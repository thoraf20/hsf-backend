import { DeclineReasonCategory } from '@domain/enums/declineReasonCategoryEnum'
import { BaseEntity } from '..'

export class DeclineReason extends BaseEntity {
  label: string
  value: string
  category: DeclineReasonCategory
  description: string
}
