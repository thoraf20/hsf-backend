import { Payment } from '@domain/entities/Payment'
import { PaymentProcessorFactory } from './factoryProducer'

export class PaymentService {
  constructor(
    private readonly paymentProcessorFactory: PaymentProcessorFactory,
  ) {}

  async makePayment(type: string, input: Partial<Payment>) {
    const processor =
      await this.paymentProcessorFactory.createPaymentProcessor(type)

    return processor.createProcess({
      amount: Number(input.amount),
      email: input.email!,
      reference: input.reference,
      metadata: input.metadata,
    })
  }

  async verify(type: string, input: Partial<Payment>) {
    const processor =
      await this.paymentProcessorFactory.createPaymentProcessor(type)

    return await processor.verifyPayment(input.reference)
  }
}
