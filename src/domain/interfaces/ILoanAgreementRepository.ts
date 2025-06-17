import { LoanAgreement } from '@domain/entities/Loans' // Adjust the import path as needed
import { SeekPaginationResult } from '@shared/types/paginate'
import { LoanAgreementFilters } from '@validators/loanAgreementValidator'

export interface ILoanAgreementRepository {
  getLoanAgreementById(loan_agreement_id: string): Promise<LoanAgreement | null>
  createLoanAgreement(loanAgreement: LoanAgreement): Promise<LoanAgreement>
  updateLoanAgreement(
    loan_agreement_id: string,
    loanAgreement: Partial<LoanAgreement>,
  ): Promise<LoanAgreement | null>
  deleteLoanAgreement(loan_agreement_id: string): Promise<void>
  getLoanAgreements(
    filters: LoanAgreementFilters,
  ): Promise<SeekPaginationResult<LoanAgreement>>
}
