import { DeclineReasonCategory } from '@domain/enums/declineReasonCategoryEnum'
import { DeclineReason } from '@entities/DeclineRequest/DeclineReason'
import db from '@infrastructure/database/knex'
import { IDeclineReasonRepository } from '@interfaces/IDeclineReasonRepository'
import { Knex } from 'knex'

export class DeclineReasonRepository implements IDeclineReasonRepository {
  private readonly tableName = 'decline_reasons'
  private knex: Knex

  constructor() {
    this.knex = db
  }

  async create(
    data: Omit<DeclineReason, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<DeclineReason> {
    const [declineReason] = await this.knex(this.tableName)
      .insert(data)
      .returning('*')
    return declineReason
  }

  async findById(id: string): Promise<DeclineReason | undefined> {
    return this.knex(this.tableName).where({ id }).first()
  }

  async findByValue(value: string): Promise<DeclineReason | undefined> {
    return this.knex(this.tableName).where({ value }).first()
  }

  async findAll(): Promise<DeclineReason[]> {
    return this.knex(this.tableName).select('*')
  }

  async update(
    id: string,
    data: Partial<Omit<DeclineReason, 'id' | 'created_at' | 'updated_at'>>,
  ): Promise<DeclineReason | undefined> {
    const [updatedDeclineReason] = await this.knex(this.tableName)
      .where({ id })
      .update(data)
      .returning('*')
    return updatedDeclineReason
  }

  async findByCategory(
    category: DeclineReasonCategory,
  ): Promise<DeclineReason[]> {
    return this.knex<DeclineReason>(this.tableName).select().where({ category })
  }

  async delete(id: string): Promise<boolean> {
    const deletedCount = await this.knex(this.tableName).where({ id }).del()
    return deletedCount > 0
  }
}
