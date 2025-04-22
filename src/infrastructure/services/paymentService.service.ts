import { Payment } from '@domain/entities/Payment'
import { PaymentProcessorFactory } from './factoryProducer'

export class PaymentService {
  constructor(
    private readonly paymentProcessorFactory: PaymentProcessorFactory,
  ) {}

  async makePayment(type: string, input: Payment) {
    const processor = await this.paymentProcessorFactory.createPaymentProcessor(
      type,
      input,
    )
    
    return await processor.createProcess(input)
  }
}
