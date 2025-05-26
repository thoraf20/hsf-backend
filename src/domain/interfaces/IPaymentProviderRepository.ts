import { invoices, PaymentEntity } from '@entities/PurchasePayment'

export interface IPaymentProviderRespository {
  createPayment(data: PaymentEntity): Promise<PaymentEntity>
  createInvoice(data: invoices): Promise<invoices>
}
