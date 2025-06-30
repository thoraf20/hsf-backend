import { LoanOfferStatus } from '@domain/enums/propertyEnum'
import { LoanOffer } from '@entities/Loans'
import db, { createUnion } from '@infrastructure/database/knex'
import { ILoanOfferRepository } from '@interfaces/ILoanOfferRepository'
import { TrendResult } from '@shared/types/general.type'
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

  public async getLoanOfferAnalytics(): Promise<{
    totalLoanOffers: number
    totalLoanOffersTrend: TrendResult
    approvedDIPs: number
    approvedDIPsTrend: TrendResult
    pendingDIPs: number
    pendingDIPsTrend: TrendResult
    declinedDIPs: number
    declinedDIPsTrend: TrendResult
  }> {
    const currentWeekStart = db.raw(`NOW() - INTERVAL '7 days'`)
    const previousWeekStart = db.raw(`NOW() - INTERVAL '14 days'`)
    const previousWeekEnd = db.raw(
      `NOW() - INTERVAL '7 days' - INTERVAL '1 microsecond'`,
    )

    const result = await db('loan_offers')
      .select<
        {
          totalLoanOffers: number
          approvedDIPs: number
          pendingDIPs: number
          declinedDIPs: number
          currentWeekTotalLoanOffers: number
          currentWeekApprovedDIPs: number
          currentWeekPendingDIPs: number
          currentWeekDeclinedDIPs: number
          previousWeekTotalLoanOffers: number
          previousWeekApprovedDIPs: number
          previousWeekPendingDIPs: number
          previousWeekDeclinedDIPs: number
        }[]
      >(
        db.raw(`COUNT(id) AS "totalLoanOffers"`),
        db.raw(`COUNT(id) FILTER (WHERE offer_status = ?) AS "approvedDIPs"`, [
          LoanOfferStatus.ACCEPTED,
        ]),
        db.raw(`COUNT(id) FILTER (WHERE offer_status = ?) AS "pendingDIPs"`, [
          LoanOfferStatus.PENDING,
        ]),
        db.raw(`COUNT(id) FILTER (WHERE offer_status = ?) AS "declinedDIPs"`, [
          LoanOfferStatus.DECLINED,
        ]),
        db.raw(
          `COUNT(id) FILTER (WHERE offer_date >= ${currentWeekStart}) AS "currentWeekTotalLoanOffers"`,
        ),
        db.raw(
          `COUNT(id) FILTER (WHERE offer_status = ? AND offer_date >= ${currentWeekStart}) AS "currentWeekApprovedDIPs"`,
          [LoanOfferStatus.ACCEPTED],
        ),
        db.raw(
          `COUNT(id) FILTER (WHERE offer_status = ? AND offer_date >= ${currentWeekStart}) AS "currentWeekPendingDIPs"`,
          [LoanOfferStatus.PENDING],
        ),
        db.raw(
          `COUNT(id) FILTER (WHERE offer_status = ? AND offer_date >= ${currentWeekStart}) AS "currentWeekDeclinedDIPs"`,
          [LoanOfferStatus.DECLINED],
        ),
        db.raw(
          `COUNT(id) FILTER (WHERE offer_date >= ${previousWeekStart} AND offer_date < ${previousWeekEnd}) AS "previousWeekTotalLoanOffers"`,
        ),
        db.raw(
          `COUNT(id) FILTER (WHERE offer_status = ? AND offer_date >= ${previousWeekStart} AND offer_date < ${previousWeekEnd}) AS "previousWeekApprovedDIPs"`,
          [LoanOfferStatus.ACCEPTED],
        ),
        db.raw(
          `COUNT(id) FILTER (WHERE offer_status = ? AND offer_date >= ${previousWeekStart} AND offer_date < ${previousWeekEnd}) AS "previousWeekPendingDIPs"`,
          [LoanOfferStatus.PENDING],
        ),
        db.raw(
          `COUNT(id) FILTER (WHERE offer_status = ? AND offer_date >= ${previousWeekStart} AND offer_date < ${previousWeekEnd}) AS "previousWeekDeclinedDIPs"`,
          [LoanOfferStatus.DECLINED],
        ),
      )
      // Assuming 'BaseEntity' includes a 'deleted_at' field for soft deletes:
      .whereNull('deleted_at')
      .first() // Use .first() to get a single row result

    // Ensure all counts are numbers, defaulting to 0 if null/undefined
    const totalLoanOffers = (result?.totalLoanOffers as number) || 0
    const approvedDIPs = (result?.approvedDIPs as number) || 0
    const pendingDIPs = (result?.pendingDIPs as number) || 0
    const declinedDIPs = (result?.declinedDIPs as number) || 0

    const currentWeekTotalLoanOffers =
      (result?.currentWeekTotalLoanOffers as number) || 0
    const currentWeekApprovedDIPs =
      (result?.currentWeekApprovedDIPs as number) || 0
    const currentWeekPendingDIPs =
      (result?.currentWeekPendingDIPs as number) || 0
    const currentWeekDeclinedDIPs =
      (result?.currentWeekDeclinedDIPs as number) || 0

    const previousWeekTotalLoanOffers =
      (result?.previousWeekTotalLoanOffers as number) || 0
    const previousWeekApprovedDIPs =
      (result?.previousWeekApprovedDIPs as number) || 0
    const previousWeekPendingDIPs =
      (result?.previousWeekPendingDIPs as number) || 0
    const previousWeekDeclinedDIPs =
      (result?.previousWeekDeclinedDIPs as number) || 0

    const totalLoanOffersTrend = this.calculateTrend(
      currentWeekTotalLoanOffers,
      previousWeekTotalLoanOffers,
    )
    const approvedDIPsTrend = this.calculateTrend(
      currentWeekApprovedDIPs,
      previousWeekApprovedDIPs,
    )
    const pendingDIPsTrend = this.calculateTrend(
      currentWeekPendingDIPs,
      previousWeekPendingDIPs,
    )
    const declinedDIPsTrend = this.calculateTrend(
      currentWeekDeclinedDIPs,
      previousWeekDeclinedDIPs,
    )

    return {
      totalLoanOffers,
      totalLoanOffersTrend,
      approvedDIPs,
      approvedDIPsTrend,
      pendingDIPs,
      pendingDIPsTrend,
      declinedDIPs,
      declinedDIPsTrend,
    }
  }

  private calculateTrend(
    currentCount: number,
    previousCount: number,
  ): TrendResult {
    let trend: number | 'N/A'
    let trendflow: 'High' | 'Low' | 'Neutral'
    let label: string

    if (previousCount === 0) {
      if (currentCount > 0) {
        trend = 'N/A' // Cannot calculate a meaningful percentage from zero
        trendflow = 'High'
        label = 'Increased significantly'
      } else {
        trend = 0
        trendflow = 'Neutral'
        label = 'No change'
      }
    } else {
      const percentage = ((currentCount - previousCount) / previousCount) * 100
      trend = parseFloat(percentage.toFixed(1)) // Keep one decimal for the number

      if (percentage > 0) {
        trendflow = 'High'
        label = `Higher than last week`
      } else if (percentage < 0) {
        trendflow = 'Low'
        label = `Less than last week`
      } else {
        trendflow = 'Neutral'
        label = 'No change from last week'
      }
    }

    return { trend, trendflow, label }
  }
}
