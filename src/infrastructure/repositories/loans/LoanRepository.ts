import { Loan } from '@entities/Loans'
import db, { createUnion } from '@infrastructure/database/knex'
import { ILoanRepository } from '@interfaces/ILoanRepository'
import { SeekPaginationResult } from '@shared/types/paginate'
import { SearchType } from '@shared/types/repoTypes'
import { applyPagination } from '@shared/utils/paginate'
import { LoanFilters } from '@validators/loanValidator'
import { Knex } from 'knex'

export class LoanRepository implements ILoanRepository {
  private readonly tableName = 'loans'

  async getLoanById(loan_id: string): Promise<Loan | null> {
    const loan = await db(this.tableName).where({ loan_id }).first()
    return loan ? new Loan(loan) : null
  }

  async getLoanByOfferId(offerId: string): Promise<Loan | null> {
    const loan = await db<Loan>(this.tableName)
      .where({ loan_offer_id: offerId })
      .first()
    return loan ? new Loan(loan) : null
  }

  async createLoan(loan: Loan): Promise<Loan> {
    const [newLoan] = await db(this.tableName).insert(loan).returning('*')
    return new Loan(newLoan)
  }

  async updateLoan(loan_id: string, loan: Partial<Loan>): Promise<Loan | null> {
    await db(this.tableName).where({ loan_id }).update(loan)
    const updatedLoan = await this.getLoanById(loan_id)
    return updatedLoan
  }

  async deleteLoan(loan_id: string): Promise<void> {
    await db(this.tableName).where({ loan_id }).del()
  }

  useFilter(q: Knex.QueryBuilder<any, any[]>, filters: LoanFilters) {
    const add = createUnion(SearchType.EXCLUSIVE)

    if (filters.user_id) {
      q = add(q).whereRaw(`user_id = '${filters.user_id}'`)
    }

    if (filters.lender_org_id) {
      q = add(q).whereRaw(`lender_org_id = '${filters.lender_org_id}'`)
    }

    if (filters.application_id) {
      q = add(q).whereRaw(`application_id = '${filters.application_id}'`)
    }

    if (filters.status) {
      q = add(q).whereRaw(`status = '${filters.status}'`)
    }

    return q
  }

  async getLoans(filters: LoanFilters): Promise<SeekPaginationResult<Loan>> {
    let baseQuery = db<Loan>(this.tableName)

    baseQuery = this.useFilter(baseQuery, filters)
    baseQuery = baseQuery.select('*').orderBy('created_at', 'desc')

    return applyPagination(baseQuery, filters)
  }
}
