import { Payment } from '@entities/Payment'
import { User } from '@entities/User'
import { SeekPaginationResult } from '@shared/types/paginate'
import { PaymentFilters } from '@validators/paymentValidator'

export interface IPaymentRepository {
  getAll(
    filters: PaymentFilters,
  ): Promise<SeekPaginationResult<Payment & { payer?: User }>>
  getById(id: string): Promise<Payment & { payer?: User }>
}
