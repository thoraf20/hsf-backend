import { Payment } from '@domain/entities/Payment'

abstract class PaymentProcessor {
  constructor(public input: Payment) {}
  abstract createProcess(input: Payment): Promise<{
    authorization_url: string
    access_code?: string
    reference: string
  }>
}

export default PaymentProcessor
