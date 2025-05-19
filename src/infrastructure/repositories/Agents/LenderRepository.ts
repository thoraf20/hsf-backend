import db from '@infrastructure/database/knex'
import { Lender, LenderProfile } from '@domain/entities/Lender'
import { ILenderRepository } from '@domain/interfaces/ILenderRepository'
import { SeekPaginationResult } from '@shared/types/paginate'
import { applyPagination } from '@shared/utils/paginate'
import { Knex } from 'knex'
import { LenderFilters } from '@validators/organizationValidator'

export class LenderRepository implements ILenderRepository {
  async createLender(lender: Lender): Promise<LenderProfile> {
    const [newLender] = await db('lenders_profile')
      .insert(lender)
      .returning('*')
    // Assuming LenderProfile is the same as the returned object structure for now
    return newLender as LenderProfile
  }

  useFilters(query: Knex.QueryBuilder<any, any[]>, filters: LenderFilters) {
    let q = query

    if (filters.lender_name) {
      q = q.where('lender_name', 'like', `%${filters.lender_name}%`)
    }

    if (filters.cac) {
      q = q.where('cac', 'like', `%${filters.cac}%`)
    }

    return q
  }

  async getLenderById(id: string): Promise<Lender | null> {
    const lender = await db('lenders_profile').where({ id }).first()
    return lender ? new Lender(lender) : null
  }

  async getAllLenders(
    filters: LenderFilters,
  ): Promise<SeekPaginationResult<Lender>> {
    let baseQuery = db<Lender>('lenders_profile').orderBy('created_at', 'desc')
    baseQuery = this.useFilters(baseQuery, filters)
    return applyPagination<Lender>(baseQuery)
  }

  async updateLender(
    id: string,
    lender: Partial<Lender>,
  ): Promise<Lender | null> {
    const [updatedLender] = await db('lenders_profile')
      .where({ id })
      .update(lender)
      .returning('*')
    return updatedLender ? new Lender(updatedLender) : null
  }

  async deleteLender(id: string): Promise<void> {
    await db('lenders_profile').where({ id }).delete()
  }

  async findLenderByName(lender_name: string): Promise<Lender | null> {
    const lender = await db('lenders_profile').where({ lender_name }).first()
    return lender ? new Lender(lender) : null
  }

  async findLenderByCac(cac: string): Promise<Lender | null> {
    const lender = await db('lenders_profile').where({ cac }).first()
    return lender ? new Lender(lender) : null
  }
}
