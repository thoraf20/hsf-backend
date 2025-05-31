abstract class PaymentProcessor {
  constructor() {}
  abstract createProcess(input: {
    amount: number
    email: string
    reference?: string
    cancel_url?: string
    metadata?: unknown
  }): Promise<PaymentIntent | null>

  abstract verifyPayment(reference: string): Promise<{
    status: string
    reference?: string
    message?: string
  }>
}

export default PaymentProcessor

export type PaymentIntent = {
  authorization_url: string
  access_code?: string
  reference: string
}
