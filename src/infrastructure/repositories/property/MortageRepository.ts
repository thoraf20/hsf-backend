import { PaymentEnum, PaymentType } from "@domain/enums/PaymentEnum";
import { TransactionEnum } from "@domain/enums/transactionEnum";
import { DIP } from "@entities/Mortage";
import { Payment } from "@entities/Payment";
import db from "@infrastructure/database/knex";
import { PaymentProcessorFactory } from "@infrastructure/services/factoryProducer";
import { PaymentService } from "@infrastructure/services/paymentService.service";
import { IMortageRespository } from "@interfaces/IMortageRespository";
import { TransactionRepository } from "@repositories/transaction/TransactionRepository";



export class MortageRepository implements IMortageRespository{
    private payment = new PaymentService(new PaymentProcessorFactory())
    private transactions = new TransactionRepository()
     async acceptDip(input: DIP): Promise<DIP> {
            const [dip] = await db('dip').insert(input).returning('*')
            return new DIP(dip) ? dip : null
     }

     async payForMortageProcess(payment: Payment, user_id: string, transaction_id: string): Promise<Payment> {
         let paymentTransaction : {}

        if(payment.paymentType == PaymentType.DUE_DELIGENT) {
            paymentTransaction =  await this.payment.makePayment(PaymentEnum.PAYSTACK, {
                amount: payment.amount,
                email: payment.email,
                metaData: { paymentType: PaymentType.DUE_DELIGENT, user_id: user_id, transaction_id },
               })
        }

        if(payment.paymentType == PaymentType.BROKER_FEE) {
            paymentTransaction =  await this.payment.makePayment(PaymentEnum.PAYSTACK, {
                amount: payment.amount,
                email: payment.email,
                metaData: { paymentType: PaymentType.BROKER_FEE, user_id: user_id, transaction_id },
               })
        }

        if(payment.paymentType == PaymentType.MANAGEMENT_FEE) {
            paymentTransaction =  await this.payment.makePayment(PaymentEnum.PAYSTACK, {
                amount: payment.amount,
                email: payment.email,
                metaData: { paymentType: PaymentType.MANAGEMENT_FEE, user_id: user_id, transaction_id },
               })
        }
          await this.transactions.saveTransaction({
                    user_id,
                    transaction_type: payment.paymentType,
                    amount: payment.amount.toString(),
                    status: TransactionEnum.PENDING,
                    transaction_id,
                  })
        return new Payment(paymentTransaction)
     }
}