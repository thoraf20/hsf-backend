import PaymentProcessor from '../../domain/interfaces/IPaymentProcessor';
import { PaymentEnum } from '../../domain/enums/PaymentEnum';
import { PaystackProcessor } from '../../domain/paymentProcessor';
import { Payment } from '../../domain/entities/Payment';

export class PaymentProcessorFactory {
    public async createPaymentProcessor(type: PaymentEnum, input: Payment): Promise<PaymentProcessor> {
        switch (type) {
            case PaymentEnum.PAYSTACK:
                return new PaystackProcessor(input);
            default:
                throw new Error("Unsupported payment processor type");
        }
    }
}
