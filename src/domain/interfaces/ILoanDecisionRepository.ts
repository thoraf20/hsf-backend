import { LoanDecision } from '@entities/Loans'

export interface ILoanDecisionRepository {
  create(loanDecision: LoanDecision): Promise<LoanDecision>
  findById(id: string): Promise<LoanDecision | null>
  update(
    id: string,
    loanDecision: Partial<LoanDecision>,
  ): Promise<LoanDecision | null>
  getByApplicationId(applicationId: string): Promise<LoanDecision | null>
}
