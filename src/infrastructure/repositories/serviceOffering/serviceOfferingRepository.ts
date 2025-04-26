import { ServiceOffering } from '@entities/serviceOffering'
import db, { createUnion } from '@infrastructure/database/knex'
import { IServiceOfferingRepository } from '@interfaces/IServiceOfferingRepository'
import { SeekPaginationResult } from '@shared/types/paginate'
import { SearchType, ServiceOfferingFilters } from '@shared/types/repoTypes'
import { QueryBoolean } from '@shared/utils/helpers'
import { Knex } from 'knex'
import { ulid } from 'ulid'

export class ServiceOfferingRepository implements IServiceOfferingRepository {
  private readonly qb = () => db('service_offerings')

  constructor() {}

  async createServiceOffering(
    serviceOffering: Partial<ServiceOffering>,
  ): Promise<ServiceOffering> {
    const productCode = await this.generateProductCode()
    const [newServiceOffering] = await this.qb()
      .insert({ ...serviceOffering, product_code: productCode })
      .returning('*')
    return newServiceOffering
  }

  async getById(serviceOfferingId: string): Promise<ServiceOffering> {
    const serviceOffering = await this.qb()
      .where({ id: serviceOfferingId })
      .first()
    return serviceOffering
  }

  async getByProductCode(productCode: string): Promise<ServiceOffering> {
    const serviceOffering = await this.qb()
      .where({ product_code: productCode })
      .first()
    return serviceOffering
  }

  async updateServiceOffering(
    serviceOfferingId: string,
    serviceOffering: Partial<ServiceOffering>,
  ): Promise<ServiceOffering> {
    const [updatedServiceOffering] = await this.qb()
      .where({ id: serviceOfferingId })
      .update(serviceOffering)
      .returning('*')
    return updatedServiceOffering
  }

  async generateProductCode() {
    let productCode: string
    let isUnique = false
    while (!isUnique) {
      productCode = `svc_${ulid().substring(0, 8).toUpperCase()}`
      const existingService = await this.getByProductCode(productCode)

      if (!existingService) {
        isUnique = true
      }
    }

    return productCode
  }

  private useFilter(
    query: Knex.QueryBuilder,
    filters?: ServiceOfferingFilters,
  ) {
    let q = query

    if (filters == null || Object.keys(filters).length < 1) return q

    const { search_type = SearchType.INCLUSIVE } = filters

    const queryAdder = createUnion(search_type)

    if (filters.deleted === QueryBoolean.YES) {
      q = queryAdder(q).whereNotNull('deleted_at')
    } else if (filters.deleted === QueryBoolean.NO) {
      q = queryAdder(q).whereNull('deleted_at')
    }

    return q
  }

  async getAllServiceOfferings(
    filters?: ServiceOfferingFilters,
  ): Promise<SeekPaginationResult<ServiceOffering>> {
    const page = filters?.page_number ?? 1
    const perPage = filters?.result_per_page ?? 10
    const offset = (page - 1) * perPage

    let baseQuery = this.qb()
    baseQuery = this.useFilter(baseQuery, filters)

    const totalRecordQuery = baseQuery.clone().count()
    const serviceOfferings = await baseQuery
      .offset(offset)
      .limit(perPage)
      .orderBy('created_at', 'desc')

    const [{ count: totalRecords }, result] = await Promise.all([
      totalRecordQuery.first(),
      serviceOfferings,
    ])

    const totalPages = Math.ceil(Number(totalRecords) / perPage)

    return {
      page,
      result,
      result_per_page: perPage,
      total_pages: totalPages,
      total_records: Number(totalRecords),
      next_page: page < totalPages ? page + 1 : null,
      prev_page: page > 1 ? page - 1 : null,
    }
  }

  async deleteServiceOffering(serviceOfferingId: string): Promise<void> {
    await this.qb().where({ service_offering_id: serviceOfferingId }).delete()
  }
}
