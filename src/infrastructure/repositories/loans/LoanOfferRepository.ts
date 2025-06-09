import { LoanOffer } from '@entities/Loans'
import db, { createUnion } from '@infrastructure/database/knex'
import { ILoanOfferRepository } from '@interfaces/ILoanOfferRepository'
import { SeekPaginationResult } from '@shared/types/paginate'
import { SearchType } from '@shared/types/repoTypes'
import { applyPagination } from '@shared/utils/paginate'
import { LoanOfferFilters } from '@validators/loanValidator'
import { Knex } from 'knex'

export class LoanOfferRepository implements ILoanOfferRepository {
  private readonly tableName = 'loan_offers'

  async getLoanOfferById(loan_offer_id: string): Promise<LoanOffer | null> {
    const loanOffer = await db(this.tableName)
      .where({ id: loan_offer_id })
      .first()
    return loanOffer ? new LoanOffer(loanOffer) : null
  }

  async createLoanOffer(loanOffer: LoanOffer): Promise<LoanOffer> {
    const [newLoanOffer] = await db(this.tableName)
      .insert(loanOffer)
      .returning('*')
    return new LoanOffer(newLoanOffer)
  }

  async updateLoanOffer(
    loan_offer_id: string,
    loanOffer: Partial<LoanOffer>,
  ): Promise<LoanOffer | null> {
    await db(this.tableName).where({ id: loan_offer_id }).update(loanOffer)
    const updatedLoanOffer = await this.getLoanOfferById(loan_offer_id)
    return updatedLoanOffer
  }

  async deleteLoanOffer(loan_offer_id: string): Promise<void> {
    await db(this.tableName).where({ id: loan_offer_id }).del()
  }

  useFilter(q: Knex.QueryBuilder<any, any[]>, filters: LoanOfferFilters) {
    const add = createUnion(SearchType.EXCLUSIVE)

    if (filters.user_id) {
      q = add(q).whereRaw(`lf.user_id = '${filters.user_id}'`)
    }

    if (filters.organization_id) {
      q = add(q).whereRaw(`lf.organization_id = '${filters.organization_id}'`)
    }

    if (filters.lender_org_id) {
      q = add(q).whereRaw(`lf.lender_org_id = '${filters.lender_org_id}'`)
    }

    if (filters.status) {
      q = add(q).whereRaw(`lf.status = '${filters.status}'`)
    }
    return q
  }

  async getLoanOffers(
    filters: LoanOfferFilters,
  ): Promise<SeekPaginationResult<LoanOffer>> {
    let baseQuery = db<LoanOffer>(`${this.tableName} as lf`)
      .innerJoin('application as a', 'a.loan_offer_id', 'lf.id')
      .select(`lf.*`)

    baseQuery = this.useFilter(baseQuery, filters)
    baseQuery = baseQuery.select('*').orderBy('lf.created_at', 'desc')

    return applyPagination(baseQuery, filters)
  }
}
