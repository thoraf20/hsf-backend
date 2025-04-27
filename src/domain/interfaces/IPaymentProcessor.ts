import { Payment } from '@domain/entities/Payment'

abstract class PaymentProcessor {
  constructor() {}
  abstract createProcess(input: Payment): Promise<{
    authorization_url: string
    access_code?: string
    reference: string
  }>

  abstract verifyPayment(reference: string): Promise<{
    status: string
    reference?: string
    message?: string
  }>
}

export default PaymentProcessor
