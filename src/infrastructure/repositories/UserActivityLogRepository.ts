import { IUserActivityLogRepository } from '@domain/repositories/IUserActivityLogRepository'
import {
  DateGroupedUserActivityLog,
  UserActivityLog,
} from '@domain/entities/UserActivityLog'
import db, { createUnion } from '@infrastructure/database/knex'
import { UserActivityFilters } from '@validators/userValidator'
import { SeekPaginationResult } from '@shared/types/paginate'
import { applyPagination } from '@shared/utils/paginate'
import { Knex } from 'knex'
import { SearchType } from '@shared/types/repoTypes'

export class UserActivityLogRepository implements IUserActivityLogRepository {
  async create(userActivityLog: UserActivityLog): Promise<UserActivityLog> {
    const [result] = await db('user_activity_logs')
      .insert(userActivityLog)
      .returning('*')
    return result
  }
  async findById(id: string): Promise<UserActivityLog | null> {
    const result = await db('user_activity_logs').where({ id }).first()
    return result || null
  }

  useFilters(
    query: Knex.QueryBuilder,
    filters: UserActivityFilters,
  ): Knex.QueryBuilder {
    let q = query

    const add = createUnion(SearchType.EXCLUSIVE)

    if (filters.user_id) {
      q = add(q).where('user_id', filters.user_id)
    }

    if (filters.organization_id) {
      q = add(q).where('organization_id', filters.organization_id)
    }

    if (filters.activity_type) {
      q = add(q).where('activity_type', filters.activity_type)
    }

    if (filters.start_date) {
      q = add(q).where('created_at', '>=', filters.start_date)
    }

    if (filters.end_date) {
      q = add(q).where('created_at', '<=', filters.end_date)
    }

    return q
  }

  async getAll(
    filters: UserActivityFilters,
  ): Promise<SeekPaginationResult<DateGroupedUserActivityLog>> {
    let query = db('user_activity_logs')
      .select(
        db.raw('DATE(created_at) as date'),
        db.raw('COUNT(*)::INTEGER as total_activities'),
        db.raw('JSON_AGG(row_to_json(user_activity_logs)) as activities'),
      )
      .groupBy('date')
      .orderBy('date', 'desc')

    query = this.useFilters(query, filters)

    const paginationResult = await applyPagination<DateGroupedUserActivityLog>(
      query,
      filters,
    )

    return paginationResult
  }
}
