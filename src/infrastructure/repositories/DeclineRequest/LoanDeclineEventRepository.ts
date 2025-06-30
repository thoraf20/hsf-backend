import { LoanDeclineEvent } from '@entities/DeclineRequest/LoanDeclineEvent'
import db from '@infrastructure/database/knex'
import { ILoanDeclineEventRepository } from '@interfaces/ILoanDeclineEventRepository'
import { Knex } from 'knex'

export class LoanDeclineEventRepository implements ILoanDeclineEventRepository {
  private readonly tableName = 'loan_decline_events'
  private knex: Knex

  constructor() {
    this.knex = db
  }

  async create(
    data: Omit<
      LoanDeclineEvent,
      'id' | 'created_at' | 'updated_at' | 'declined_at'
    >,
  ): Promise<LoanDeclineEvent> {
    // declined_at is handled by the default value in the migration
    const [loanDeclineEvent] = await this.knex(this.tableName)
      .insert(data)
      .returning('*')
    return loanDeclineEvent
  }

  async findById(id: string): Promise<LoanDeclineEvent | undefined> {
    return this.knex(this.tableName).where({ id }).first()
  }

  async findByLoanId(loanId: string): Promise<LoanDeclineEvent[]> {
    return this.knex(this.tableName).where({ loan_id: loanId }).select('*')
  }

  async update(
    id: string,
    data: Partial<
      Omit<LoanDeclineEvent, 'id' | 'created_at' | 'updated_at' | 'declined_at'>
    >,
  ): Promise<LoanDeclineEvent | undefined> {
    const [updatedLoanDeclineEvent] = await this.knex(this.tableName)
      .where({ id })
      .update(data)
      .returning('*')
    return updatedLoanDeclineEvent
  }

  async delete(id: string): Promise<boolean> {
    const deletedCount = await this.knex(this.tableName).where({ id }).del()
    return deletedCount > 0
  }
}
