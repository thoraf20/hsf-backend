import { Payment } from '@entities/Payment'
import { getUserClientView, UserClientView } from '@entities/User'
import { IPaymentRepository } from '@interfaces/IPaymentRepository'
import { PaymentFilters } from '@validators/paymentValidator'

export class PaymentUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async getById(id: string): Promise<Payment & { payer?: UserClientView }> {
    const payment = await this.paymentRepository.getById(id)

    if (!payment) {
      return null
    }

    return {
      ...payment,
      payer: payment.payer ? getUserClientView(payment.payer) : null,
    }
  }

  async getAll(filters: PaymentFilters) {
    const paymentContents = await this.paymentRepository.getAll(filters)
    //@ts-ignore
    paymentContents.result = paymentContents.result.map((payment) => {
      return {
        ...payment,
        payer: payment.payer ? getUserClientView(payment.payer) : null,
      }
    })

    return paymentContents
  }
}
