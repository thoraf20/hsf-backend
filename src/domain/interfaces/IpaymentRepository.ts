import { invoices, PaymentEntity } from "@entities/PurchasePayment";


export interface IPaymentRespository {
  createPayment(data: PaymentEntity): Promise<PaymentEntity>;
  createInvoice(data: invoices): Promise<invoices>;


}