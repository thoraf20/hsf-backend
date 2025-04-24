import { DIP } from '@entities/Mortage'
import { Payment } from '@entities/Payment'
import {
  LoanOffer,
  uploadDocument,
  uploadPrecedentDocument,
} from '@entities/PurchasePayment'
import { MortagePayment } from '@entities/Transaction'

export interface IMortageRespository {
  acceptDip(input: DIP): Promise<DIP>
  payForMortageProcess(
    payment: Payment,
    metaData: Record<string, any>,
    paymentType: string,
    user_id: string,
    transaction_id: string,
    property_id: string,
  ): Promise<Payment | boolean>
  uploadDocument(input: uploadDocument): Promise<uploadDocument>
  uploadPrecedentDocument(
    input: uploadPrecedentDocument,
  ): Promise<uploadPrecedentDocument>
  savePaymentStatus(
    property_id: string,
    user_id: string,
  ): Promise<MortagePayment>
  getPaymentStatusByIds(
    property_id: string,
    user_id: string,
  ): Promise<MortagePayment>
  updateLoanOffer(
    input: Partial<LoanOffer>,
    property_id: string,
    user_id: string,
  ): Promise<void>
  getLoanOfferById(property_id: string, user_id: string): Promise<LoanOffer>
}
