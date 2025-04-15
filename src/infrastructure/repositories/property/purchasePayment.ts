import { IPaymentRespository } from "@domain/interfaces/IpaymentRepository";
import { invoices, PaymentEntity } from "@entities/PurchasePayment";
import db from "@infrastructure/database/knex";

export class paymentRepository implements  IPaymentRespository{

    public async createPayment(data: PaymentEntity): Promise<PaymentEntity> {
        const [payment] = await db('payments').insert(data).returning('*');
        return new PaymentEntity(payment) ? payment : null;
    }

    public async createInvoice(data: any): Promise<invoices> {
        const [invoice] = await db('invoices').insert(data).returning('*');
        return new invoices(invoice) ? invoice : null;
    }



} 
