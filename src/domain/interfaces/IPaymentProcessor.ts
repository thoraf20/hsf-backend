import { Payment } from '@domain/entities/Payment'

abstract class PaymentProcessor {
  constructor(public input: Payment) {}
  abstract createProcess(input: Payment): Promise<Payment>
}

export default PaymentProcessor
