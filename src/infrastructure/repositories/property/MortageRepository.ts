import { PaymentEnum, PaymentType } from '@domain/enums/PaymentEnum'
import { TransactionEnum } from '@domain/enums/transactionEnum'
import { DIP } from '@entities/Mortage'
import { Payment } from '@entities/Payment'
import {
  LoanOffer,
  uploadDocument,
  uploadPrecedentDocument,
} from '@entities/PurchasePayment'
import { MortagePayment } from '@entities/Transaction'
import db from '@infrastructure/database/knex'
import { PaymentProcessorFactory } from '@infrastructure/services/factoryProducer'
import { PaymentService } from '@infrastructure/services/paymentService.service'
import { IMortageRespository } from '@interfaces/IMortageRespository'
import { TransactionRepository } from '@repositories/transaction/TransactionRepository'
import { ApplicationRepository } from './ApplicationRespository'
import { LoanOfferStatus } from '@domain/enums/propertyEnum'

export class MortageRepository implements IMortageRespository {
  private payment = new PaymentService(new PaymentProcessorFactory())
  private application = new ApplicationRepository()
  private transactions = new TransactionRepository()
  async acceptDip(input: DIP): Promise<DIP> {
    const [dip] = await db('dip').insert(input).returning('*')
    return new DIP(dip) ? dip : null
  }

  async savePaymentStatus(
    property_id: string,
    user_id: string,
  ): Promise<MortagePayment> {
    const [PaymentStatus] = await db('mortage_payment_status')
      .insert({ property_id, user_id })
      .returning('*')
    return new MortagePayment(PaymentStatus) ? PaymentStatus : null
  }

  async getPaymentStatusByIds(
    property_id: string,
    user_id: string,
  ): Promise<MortagePayment> {
    return await db('mortage_payment_status')
      .select('*')
      .where('property_id', property_id)
      .andWhere('user_id', user_id)
      .first()
  }

  async uploadDocument(input: uploadDocument): Promise<uploadDocument> {
    const [documents] = await db('document_upload').insert(input).returning('*')
    return new uploadDocument(documents) ? documents : null
  }

  async uploadPrecedentDocument(
    input: uploadPrecedentDocument,
  ): Promise<uploadPrecedentDocument> {
    const [documents] = await db('precedent_document_upload')
      .insert(input)
      .returning('*')
    return new uploadDocument(documents) ? documents : null
  }

  async getLoanOfferById(
    property_id: string,
    user_id: string,
  ): Promise<LoanOffer> {
    const [loan] = await db('loan_offer')
      .select('*')
      .where('property_id', property_id)
      .andWhere('user_id', user_id)
    return new LoanOffer(loan) ? loan : null
  }
  async updateLoanOffer(
    input: LoanOffer,
    property_id: string,
    user_id: string,
  ): Promise<void> {
    if (input.loan_acceptance_status === LoanOfferStatus.ACCEPTED) {
      await db('loan_offer')
        .update({
          loan_acceptance_status: input.loan_acceptance_status,
          accepted: true,
        })
        .where('property_id', property_id)
        .andWhere('user_id', user_id)
    } else 
    await db('loan_offer')
    .update({
      loan_acceptance_status: input.loan_acceptance_status,
    })
    .where('property_id', property_id)
    .andWhere('user_id', user_id)
  }
  async payForMortageProcess(
    payment: Payment,
    metaData: Record<string, any>,
    paymentType: string,
    user_id: string,
    transaction_id: string,
    property_id: string,
  ): Promise<Payment | boolean> {
    let paymentTransaction: {}

    if (paymentType == PaymentType.DUE_DELIGENT) {
      paymentTransaction = await this.payment.makePayment(
        PaymentEnum.PAYSTACK,
        {
          amount: '100000',
          email: payment.email,
          metaData,
        },
      )
    }

    if (paymentType == PaymentType.BROKER_FEE) {
      paymentTransaction = await this.payment.makePayment(
        PaymentEnum.PAYSTACK,
        {
          amount: '50000',
          email: payment.email,
          metaData,
        },
      )
    }

    if (paymentType == PaymentType.MANAGEMENT_FEE) {
      paymentTransaction = await this.payment.makePayment(
        PaymentEnum.PAYSTACK,
        {
          amount: '5000000',
          email: payment.email,
          metaData,
        },
      )
    }

    const findIfSaveExit = await this.getPaymentStatusByIds(
      property_id,
      user_id,
    )
    if (findIfSaveExit) {
      return false
    } else {
      const paymentSaved = await this.savePaymentStatus(property_id, user_id)
      await this.application.updateApplication({
        property_id,
        mortage_payment_status_id: paymentSaved.mortage_payment_status_id,
        user_id,
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
