import { PaymentEnum } from '../../domain/enums/PaymentEnum';
import { Payment } from '../../domain/entities/Payment';
import { PaymentProcessorFactory } from "./factoryProducer";

export class PaymentService {
    constructor(private readonly paymentProcessorFactory: PaymentProcessorFactory) {}

    async makePayment(input: Payment): Promise<Payment> {
        const processor = await this.paymentProcessorFactory.createPaymentProcessor(PaymentEnum.PAYSTACK, input);
        return await processor.createProcess(input);
    }
}
