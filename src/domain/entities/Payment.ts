import { PartialInstantiable } from '@shared/types/partials'

export class Payment extends PartialInstantiable<Payment> {
  id?: string
  amount?: number | string
  email: string
  currency?: string
  payment_type?: string
  payment_method?: string
  user_id?: string
  reference?: string
  transaction_id?: string
  status?: 'pending' | 'success' | 'failed'
  metadata?: Record<string, any>
  createdAt?: Date
  updatedAt?: Date

  constructor(data: Partial<Payment>) {
    super(data)
    if (data) {
      Object.assign(this, data)
    }
  }
}
