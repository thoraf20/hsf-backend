import { PaymentEnum, PaymentType } from '@domain/enums/PaymentEnum'
import { TransactionEnum } from '@domain/enums/transactionEnum'
import { DIP } from '@entities/Mortage'
import { Payment } from '@entities/Payment'
import {
  LoanOffer,
  uploadDocument,
  uploadPrecedentDocument,
} from '@entities/PurchasePayment'
import { MortgagePayment } from '@entities/Transaction'
import db, { createUnion } from '@infrastructure/database/knex'
import { PaymentProcessorFactory } from '@infrastructure/services/factoryProducer'
import { PaymentService } from '@infrastructure/services/paymentService.service'
import { IMortgageRepository } from '@interfaces/IMortgageRepository'
import { TransactionRepository } from '@repositories/transaction/TransactionRepository'
// import { ApplicationRepository } from './ApplicationRespository'
import { LoanOfferStatus } from '@domain/enums/propertyEnum'
import { DipFilters } from '@validators/applicationValidator'
import { Knex } from 'knex'
import { SeekPaginationResult } from '@shared/types/paginate'
import { SearchType } from '@shared/types/repoTypes'
import { applyPagination } from '@shared/utils/paginate'
import { Application } from '@entities/Application'

export class MortgageRepository implements IMortgageRepository {
  private paymentService = new PaymentService(new PaymentProcessorFactory())
  // private applicationRepo = new ApplicationRepository()
  private transactionRepo = new TransactionRepository()

  async acceptDip(input: DIP): Promise<DIP> {
    const [dip] = await db('dip').insert(input).returning('*')
    return dip ?? null
  }

  getDipByEligibilityID(id: string): Promise<DIP> {
    return db<DIP>('dip').select().where('eligibility_id', id).first()
  }

  getDipByID(id: string): Promise<DIP> {
    return db<DIP>('dip').select().where('dip_id', id).first()
  }

  async savePaymentStatus(
    property_id: string,
    user_id: string,
  ): Promise<MortgagePayment> {
    const [status] = await db('mortage_payment_status')
      .insert({ property_id, user_id })
      .returning('*')
    return status ?? null
  }

  async getPaymentStatusByIds(
    property_id: string,
    user_id: string,
  ): Promise<MortgagePayment> {
    return await db('mortage_payment_status')
      .where({ property_id, user_id })
      .first()
  }

  async uploadDocument(input: uploadDocument): Promise<uploadDocument> {
    const [doc] = await db('document_upload').insert(input).returning('*')
    return doc ?? null
  }

  async uploadPrecedentDocument(
    input: uploadPrecedentDocument,
  ): Promise<uploadPrecedentDocument> {
    const [doc] = await db('precedent_document_upload')
      .insert(input)
      .returning('*')
    return doc ?? null
  }

  async getLoanOfferById(
    property_id: string,
    user_id: string,
  ): Promise<LoanOffer> {
    const [offer] = await db('loan_offer')
      .where({ property_id, user_id })
      .select('*')
    return offer ?? null
  }

  async updateLoanOffer(
    input: LoanOffer,
    property_id: string,
    user_id: string,
  ): Promise<void> {
    const updateData: Partial<LoanOffer> = {
      loan_acceptance_status: input.loan_acceptance_status,
    }

    if (input.loan_acceptance_status === LoanOfferStatus.ACCEPTED) {
      updateData.accepted = true
    }

    await db('loan_offer').update(updateData).where({ property_id, user_id })
  }

  async payForMortageProcess(
    payment: Payment,
    metadata: Record<string, any>,
    paymentType: string,
    user_id: string,
    transaction_id: string,
    property_id: string,
  ): Promise<Payment | boolean> {
    const existingStatus = await this.getPaymentStatusByIds(
      property_id,
      user_id,
    )
    if (existingStatus) return false
    const validPaymentTypes = [
      PaymentType.DUE_DILIGENT,
      PaymentType.BROKER_FEE,
      PaymentType.MANAGEMENT_FEE,
    ]

    if (!validPaymentTypes.includes(paymentType as PaymentType)) {
      throw new Error(`Invalid payment type: ${paymentType}`)
    }

    const paymentTransaction = await this.paymentService.makePayment(
      PaymentEnum.PAYSTACK,
      {
        amount: payment.amount,
        email: payment.email,
        metadata,
      },
    )

    await this.savePaymentStatus(property_id, user_id)
    // await this.applicationRepo.updateApplication({
    //   property_id,
    //   user_id,
    //   mortage_payment_status_id: savedStatus.mortage_payment_status_id,
    // })

    // Record transaction
    await this.transactionRepo.saveTransaction({
      user_id,
      transaction_type: paymentType,
      property_id,
      reference: paymentTransaction.reference,
      amount: payment.amount as number,
      status: TransactionEnum.PENDING,
      transaction_id,
    })

    return new Payment(paymentTransaction as any)
  }

  async initiate(input: DIP): Promise<DIP> {
    const [inserted] = await db<DIP>('dip').insert(input).returning('*')
    return inserted
  }

  useFilter(q: Knex.QueryBuilder<any, any[]>, filters: DipFilters) {
    const add = createUnion(SearchType.EXCLUSIVE)

    if (filters.status) {
      q = add(q).whereRaw(db.raw(`d.dip_status = '${filters.status}'`))
    }

    if (filters.user_id) {
      q = add(q).whereRaw(db.raw(`d.user_id = '${filters.user_id}'`))
    }

    if (filters.property_id) {
      q = add(q).whereRaw(db.raw(`d.property_id = '${filters.property_id}'`))
    }

    if (filters.lender_id) {
      q = add(q).whereRaw(`e.lender_id = '${filters.lender_id}'`)
    }

    return q
  }

  getAllDips(
    filters: DipFilters,
  ): Promise<SeekPaginationResult<DIP & { application: Application }>> {
    let baseQuery = db<DIP>('dip as d')
      .innerJoin('application as a', 'a.application_id', 'd.application_id')
      .innerJoin('eligibility as e', 'e.eligibility_id', 'a.eligibility_id')
      .select('d.*', db.raw('row_to_json(a) as application'))

    baseQuery = this.useFilter(baseQuery, filters)
    baseQuery = baseQuery.orderBy('created_at', 'desc')

    return applyPagination(baseQuery, filters)
  }

  async updateDipById(dip: Partial<DIP>): Promise<DIP> {
    const [updated] = await db<DIP>('dip')
      .update(dip)
      .where('dip_id', dip.dip_id)
      .returning('*')

    return updated
  }
}
