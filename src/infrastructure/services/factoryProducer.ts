import PaymentProcessor from '@domain/interfaces/IPaymentProcessor'
import { PaymentEnum } from '@domain/enums/PaymentEnum'
import { PaystackProcessor } from '@domain/paymentProcessor'
import { Payment } from '@domain/entities/Payment'

export class PaymentProcessorFactory {
  public async createPaymentProcessor(
    type: string,
    input: Payment,
  ): Promise<PaymentProcessor> {
    if (type === PaymentEnum.PAYSTACK) {
      return new PaystackProcessor().createProcess(input)
    }
  }
}
