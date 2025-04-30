import PaymentProcessor from '@domain/interfaces/IPaymentProcessor'
import { PaymentEnum } from '@domain/enums/PaymentEnum'
import { PaystackProcessor } from '@domain/paymentProcessor'

export class PaymentProcessorFactory {
  public async createPaymentProcessor(type: string): Promise<PaymentProcessor> {
    if (type === PaymentEnum.PAYSTACK) {
      return new PaystackProcessor()
    }
  }
}
