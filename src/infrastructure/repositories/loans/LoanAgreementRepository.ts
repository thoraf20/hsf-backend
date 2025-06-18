import { LoanAgreement } from '@domain/entities/Loans' // Adjust the import path as needed
import db, { createUnion } from '@infrastructure/database/knex'
import { ILoanAgreementRepository } from '@interfaces/ILoanAgreementRepository'
import { SeekPaginationResult } from '@shared/types/paginate'
import { SearchType } from '@shared/types/repoTypes'
import { applyPagination } from '@shared/utils/paginate'
import { LoanAgreementFilters } from '@validators/loanAgreementValidator' // Assuming you have filters
import { Knex } from 'knex'

export class LoanAgreementRepository implements ILoanAgreementRepository {
  private readonly tableName = 'loan_agreements'

  async getLoanAgreementById(
    loan_agreement_id: string,
  ): Promise<LoanAgreement | null> {
    const loanAgreement = await db<LoanAgreement>(this.tableName)
      .where({ id: loan_agreement_id })
      .first()
    return loanAgreement
  }

  async getLoanAgreementByOfferId(
    loan_offer_id: string,
  ): Promise<LoanAgreement | null> {
    const loanAgreement = await db<LoanAgreement>(this.tableName)
      .where({ loan_offer_id })
      .first()
    return loanAgreement
  }

  async createLoanAgreement(
    loanAgreement: LoanAgreement,
  ): Promise<LoanAgreement> {
    const [newLoanAgreement] = await db<LoanAgreement>(this.tableName)
      .insert(loanAgreement)
      .returning('*')
    return newLoanAgreement
  }

  async updateLoanAgreement(
    loan_agreement_id: string,
    loanAgreement: Partial<LoanAgreement>,
  ): Promise<LoanAgreement | null> {
    await db(this.tableName)
      .where({ id: loan_agreement_id })
      .update(loanAgreement)
    const updatedLoanAgreement =
      await this.getLoanAgreementById(loan_agreement_id)
    return updatedLoanAgreement
  }

  async deleteLoanAgreement(loan_agreement_id: string): Promise<void> {
    await db(this.tableName).where({ id: loan_agreement_id }).del()
  }

  useFilter(q: Knex.QueryBuilder<any, any[]>, filters: LoanAgreementFilters) {
    const add = createUnion(SearchType.EXCLUSIVE)

    if (filters.loan_id) {
      q = add(q).whereRaw(`la.loan_id = '${filters.loan_id}'`)
    }

    if (filters.loan_offer_id) {
      q = add(q).whereRaw(`la.loan_offer_id = '${filters.loan_offer_id}'`)
    }

    if (filters.status) {
      q = add(q).whereRaw(`la.status = '${filters.status}'`)
    }

    return q
  }

  async getLoanAgreements(
    filters: LoanAgreementFilters,
  ): Promise<SeekPaginationResult<LoanAgreement>> {
    let baseQuery = db<LoanAgreement>(`${this.tableName} as la`).select(`la.*`)

    baseQuery = this.useFilter(baseQuery, filters)
    baseQuery = baseQuery.select('*').orderBy('la.created_at', 'desc')

    return applyPagination(baseQuery, filters)
  }
}
