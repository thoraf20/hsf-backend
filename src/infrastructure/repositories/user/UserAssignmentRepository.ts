import db, { createUnion } from '@infrastructure/database/knex'
import { IUserAssignmentRepository } from '@domain/interfaces/IUserAssignmentRepository'
import { SeekPaginationResult } from '@shared/types/paginate'
import { applyPagination } from '@shared/utils/paginate'
import { Knex } from 'knex'
import { UserAssignment } from '@entities/User'
import { UserAssignmentFilters } from '@validators/userValidator'
import { SearchType } from '@shared/types/repoTypes'
import { AssignableType } from '@domain/enums/userEum'

export class UserAssignmentRepository implements IUserAssignmentRepository {
  private readonly tableName = 'user_assignments'

  async create(assignment: UserAssignment): Promise<UserAssignment> {
    const [newAssignment] = await db<UserAssignment>(this.tableName)
      .insert({
        ...assignment,
      })
      .returning('*')
    return newAssignment
  }

  async findById(id: string): Promise<UserAssignment | null> {
    const assignment = await db<UserAssignment>(this.tableName)
      .where({ id })
      .first()
    return assignment ? assignment : null
  }

  async findByAssignable(
    assignableId: string,
    assignableType: AssignableType,
    filters?: UserAssignmentFilters,
  ): Promise<SeekPaginationResult<UserAssignment>> {
    let baseQuery = db<UserAssignment>(this.tableName)
      .where({ assignable_id: assignableId, assignable_type: assignableType })
      .orderBy('assigned_at', 'desc')

    baseQuery = this.useFilter(baseQuery, filters)

    return applyPagination(baseQuery, filters)
  }

  async findByUser(
    userId: string,
    filters?: UserAssignmentFilters,
  ): Promise<SeekPaginationResult<UserAssignment>> {
    let baseQuery = db<UserAssignment>(this.tableName)
      .where({ user_id: userId })
      .orderBy('assigned_at', 'desc')

    baseQuery = this.useFilter(baseQuery, filters)

    return applyPagination(baseQuery, filters)
  }

  async findCurrentAssignment(
    assignableId: string,
    assignableType: AssignableType,
  ): Promise<UserAssignment | null> {
    let query = db<UserAssignment>(this.tableName)
      .where({ assignable_id: assignableId, assignable_type: assignableType })
      .whereNull('unassigned_at')
      .first()

    const assignment = await query
    return assignment ? assignment : null
  }

  async update(
    id: string,
    updates: Partial<UserAssignment>,
  ): Promise<UserAssignment | null> {
    const [updatedAssignment] = await db<UserAssignment>(this.tableName)
      .where({ id })
      .update({ ...updates, updated_at: new Date() })
      .returning('*')
    return updatedAssignment ? updatedAssignment : null
  }

  async delete(id: string): Promise<void> {
    await db(this.tableName).where({ id }).del()
  }

  private useFilter(
    query: Knex.QueryBuilder<any, any[]>,
    filters?: UserAssignmentFilters,
  ): Knex.QueryBuilder<any, any[]> {
    let q = query

    if (!filters || Object.keys(filters).length < 1) return q

    const add = createUnion(SearchType.EXCLUSIVE) // Assuming EXCLUSIVE by default for combined filters

    if (filters.user_id) {
      q = add(q).where('user_id', filters.user_id)
    }
    if (filters.assignable_id) {
      q = add(q).where('assignable_id', filters.assignable_id)
    }
    if (filters.assignable_type) {
      q = add(q).where('assignable_type', filters.assignable_type)
    }
    if (filters.role) {
      q = add(q).where('role', filters.role)
    }

    return q
  }

  async getAll(
    filters?: UserAssignmentFilters,
  ): Promise<SeekPaginationResult<UserAssignment>> {
    let baseQuery = db<UserAssignment>(this.tableName).orderBy(
      'created_at',
      'desc',
    )
    baseQuery = this.useFilter(baseQuery, filters)

    return applyPagination(baseQuery, filters)
  }
}
