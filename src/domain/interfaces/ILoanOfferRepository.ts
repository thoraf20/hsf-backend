import { LoanOffer } from '@entities/Loans'
import { SeekPaginationResult } from '@shared/types/paginate'
import { LoanOfferFilters } from '@validators/loanValidator'

export interface ILoanOfferRepository {
  getLoanOfferById(loan_offer_id: string): Promise<LoanOffer | null>
  createLoanOffer(loanOffer: LoanOffer): Promise<LoanOffer>
  updateLoanOffer(
    loan_offer_id: string,
    loanOffer: Partial<LoanOffer>,
  ): Promise<LoanOffer | null>

  getLoanOffers(
    filters: LoanOfferFilters,
  ): Promise<SeekPaginationResult<LoanOffer>>
  deleteLoanOffer(loan_offer_id: string): Promise<void>
}
