import { LoanDecision } from '@entities/Loans'
import db from '@infrastructure/database/knex'
import { ILoanDecisionRepository } from '@interfaces/ILoanDecisionRepository'

export class LoanDecisionRepository implements ILoanDecisionRepository {
  private readonly tableName = 'loan_decisions'

  async create(loanDecision: LoanDecision): Promise<LoanDecision> {
    const [newLoanDecision] = await db(this.tableName)
      .insert(loanDecision)
      .returning('*')
    return new LoanDecision(newLoanDecision)
  }

  async findById(id: string): Promise<LoanDecision | null> {
    const loanDecision = await db(this.tableName).where({ id }).first()
    return loanDecision ? new LoanDecision(loanDecision) : null
  }

  async getByApplicationId(
    applicationId: string,
  ): Promise<LoanDecision | null> {
    const loanDecision = await db(this.tableName)
      .where({ application_id: applicationId })
      .first()
    return loanDecision ? new LoanDecision(loanDecision) : null
  }

  async update(
    id: string,
    loanDecision: Partial<LoanDecision>,
  ): Promise<LoanDecision | null> {
    const [updatedLoanDecision] = await db(this.tableName)
      .where({ id })
      .update(loanDecision)
      .returning('*')
    return updatedLoanDecision ? new LoanDecision(updatedLoanDecision) : null
  }
}
