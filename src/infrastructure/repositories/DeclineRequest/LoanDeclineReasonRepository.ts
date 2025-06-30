import { LoanDeclineReason } from '@entities/DeclineRequest/LoanDeclineReason'
import db from '@infrastructure/database/knex'
import { ILoanDeclineReasonRepository } from '@interfaces/ILoanDeclineReasonRepository'
import { Knex } from 'knex'

export class LoanDeclineReasonRepository
  implements ILoanDeclineReasonRepository
{
  private readonly tableName = 'loan_decline_reasons'
  private knex: Knex

  constructor() {
    this.knex = db
  }

  async create(
    data: Omit<LoanDeclineReason, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<LoanDeclineReason> {
    const [loanDeclineReason] = await this.knex(this.tableName)
      .insert(data)
      .returning('*')
    return loanDeclineReason
  }

  async findById(id: string): Promise<LoanDeclineReason | undefined> {
    return this.knex(this.tableName).where({ id }).first()
  }

  async findByLoanDeclineEventId(
    loanDeclineEventId: string,
  ): Promise<LoanDeclineReason[]> {
    return this.knex(this.tableName)
      .where({ loan_decline_event_id: loanDeclineEventId })
      .select('*')
  }

  async findByDeclineReasonId(
    declineReasonId: string,
  ): Promise<LoanDeclineReason[]> {
    return this.knex(this.tableName)
      .where({ decline_reason_id: declineReasonId })
      .select('*')
  }

  async findByLoanDeclineEventIdAndDeclineReasonId(
    loanDeclineEventId: string,
    declineReasonId: string,
  ): Promise<LoanDeclineReason | undefined> {
    return this.knex(this.tableName)
      .where({
        loan_decline_event_id: loanDeclineEventId,
        decline_reason_id: declineReasonId,
      })
      .first()
  }

  async delete(id: string): Promise<boolean> {
    const deletedCount = await this.knex(this.tableName).where({ id }).del()
    return deletedCount > 0
  }
}
