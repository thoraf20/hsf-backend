import { Developer, DevelopeReg } from '@entities/Developer'
import db from '@infrastructure/database/knex'
import { IDeveloperRepository } from '@interfaces/IDeveloperRepository'
import { SeekPaginationResult } from '@shared/types/paginate'
import { applyPagination } from '@shared/utils/paginate'
import { DeveloperFilters } from '@validators/developerValidator'
import { Knex } from 'knex'

export class DeveloperRepository implements IDeveloperRepository {
  private readonly tableName = 'developers_profile'

  async createDeveloperProfile(data: Developer): Promise<DevelopeReg> {
    const [developer] = await db(this.tableName).insert(data).returning('*')
    return new Developer(developer) ? developer : null
  }
  async getCompanyName(company_name: string): Promise<Developer> {
    const developer = await db(this.tableName)
      .where('company_name', company_name)
      .first()

    return developer ? new Developer(developer) : null
  }

  async getCompanyRegistrationNumber(
    company_registration_number: string,
  ): Promise<Developer> {
    const developer = await db(this.tableName)
      .where('company_registration_number', company_registration_number)
      .first()

    return developer ? new Developer(developer) : null
  }

  async getCompanyEmail(company_email: string): Promise<Developer> {
    const developer = await db(this.tableName)
      .where('company_email', company_email)
      .first()

    return developer ? new Developer(developer) : null
  }

  async getDeveloperByOrgId(orgId: string): Promise<Developer> {
    return db<Developer>(this.tableName).where('organization_id', orgId).first()
  }

  async getDeveloperById(id: string): Promise<Developer> {
    return db<Developer>(this.tableName).where('profile_id', id).first()
  }

  useFilters(
    query: Knex.QueryBuilder<Developer, Developer[]>,
    filters: DeveloperFilters,
  ): Knex.QueryBuilder<Developer, Developer[]> {
    let q = query

    if (!filters || Object.keys(filters).length < 1) {
      return q
    }

    if (filters.first_name) {
      q = q.where('first_name', 'ilike', `%${filters.first_name}%`)
    }
    if (filters.last_name) {
      q = q.where('last_name', 'ilike', `%${filters.last_name}%`)
    }
    if (filters.email) {
      q = q.where('email', 'ilike', `%${filters.email}%`)
    }
    if (filters.company_name) {
      q = q.where('company_name', 'ilike', `%${filters.company_name}%`)
    }
    if (filters.specialization) {
      q = q.where('specialization', 'ilike', `%${filters.specialization}%`)
    }

    return q
  }

  async getDevelopers(
    filters: DeveloperFilters,
  ): Promise<SeekPaginationResult<Developer>> {
    let baseQuery = db<Developer>('developers_profile')

    baseQuery = this.useFilters(baseQuery, filters)

    baseQuery = baseQuery.orderBy('created_at', 'asc')

    return applyPagination<Developer>(baseQuery, filters)
  }
}
