import db from '@infrastructure/database/knex'
import { IPropertyRepository } from '@domain/interfaces/IPropertyRepository'
import { Properties } from '@domain/entities/Property'
import {
  PropertyCount,
  PropertyFilters,
  propertyStatusFilter,
  SortDateBy,
} from '@shared/types/repoTypes'
import {
  SeekPaginationOption,
  SeekPaginationResult,
} from '@shared/types/paginate'
import { Knex } from 'knex'

export class PropertyRepository implements IPropertyRepository {
  async createProperties(property: Properties): Promise<Properties> {
    const [newProperty] = await db('properties').insert(property).returning('*')
    return new Properties(newProperty)
  }

  useFilter(query: Knex.QueryBuilder<any, any[]>, filters?: PropertyFilters) {
    let q = query
    if (filters == null) return q

    if (filters.sortBy) {
      switch (filters.sortBy) {
        case SortDateBy.RecentlyAdded:
          q = q.orderBy('created_at', 'desc') // Newest first
          break
        case SortDateBy.LastUpdated:
          q = q.orderBy('updated_at', 'desc') // Recently updated first
          break
        case SortDateBy.Earliest:
          q = q.orderBy('created_at', 'asc') // Oldest first
          break
      }
    }

    if (filters.property_type) {
      q = q.where('property_type', 'ILIKE', `%${filters.property_type}%`)
    }

    if (filters.financing_type) {
      q = q.whereRaw('? ILIKE ANY(financial_types)', [filters.financing_type])
    }

    if (filters.max_price) {
      q = q.whereBetween('property_price', [
        filters?.min_price || '1',
        filters.max_price,
      ])
    }

    if (filters.property_status) {
      switch (filters.property_status) {
        case propertyStatusFilter.Available:
          q = q.where({ is_sold: false, is_live: false })
          break
        case propertyStatusFilter.Pending:
          q = q.where({ is_live: false })
          break

        case propertyStatusFilter.Sold:
          q = q.where({ is_sold: true })
          break
      }
    }

    if (filters.bedrooms) {
      q = q.where({ numbers_of_bedroom: filters.bedrooms })
    }

    if (filters.bathrooms) {
      q = q.where({ numbers_of_bathroom: filters.bathrooms })
    }

    if (filters.property_features) {
      for (var feat of filters.property_features.split('*')) {
        q = q.whereRaw('? ILIKE ANY(property_feature)', [feat])
      }
    }
    return q
  }

  async getAllProperties(
    filters?: PropertyFilters,
    userRole: string = 'guest',
    userId?: string,
  ): Promise<SeekPaginationResult<Properties>> {
    const page = filters?.page_number ?? 1
    const perPage = filters?.result_per_page ?? 10
    const offset = (page - 1) * perPage

    let baseQuery = db('properties')
      .where({ is_live: true })
      .join('users', 'users.id', '=', 'properties.user_id')

    baseQuery = this.useFilter(baseQuery, filters)

    const totalRecordsQuery = baseQuery.clone().count('* as count').first()
    const [{ count: total }] = await Promise.all([totalRecordsQuery])

    let dataQuery = baseQuery
      .clone()
      .select('properties.*')
      .orderBy('properties.id', 'desc')
      .limit(perPage)
      .offset(offset)

    if (userId) {
      dataQuery = dataQuery.select(
        db.raw(
          `(SELECT EXISTS (
            SELECT 1 FROM property_watchlist 
            WHERE property_watchlist.property_id = properties.id 
            AND property_watchlist.user_id = ?
          )) AS is_whitelisted`,
          [userId],
        ),
      )
    }

    if (!['super_admin', 'admin', 'developer'].includes(userRole)) {
      dataQuery = dataQuery.select(db.raw('NULL as documents'))
    }

    const rawResult = await dataQuery

    const result = rawResult.map((item) => ({
      ...item,
      is_whitelisted:
        item.is_whitelisted === true || item.is_whitelisted === 't',
    }))

    const totalPages = Math.ceil(Number(total) / perPage)

    return new SeekPaginationResult<Properties>({
      result,
      result_per_page: perPage,
      page,
      total_records: Number(total),
      total_pages: totalPages,
      next_page: page < totalPages ? page + 1 : null,
      prev_page: page > 1 ? page - 1 : null,
    })
  }

  async findPropertyById(id: string, userRole?: string): Promise<any> {
    let query = db('properties')
      .select([
        'properties.*',
        'offer_letter.offer_letter_status',
        'offer_letter.offer_letter_requested',
        'offer_letter.offer_letter_approved',
        'offer_letter.offer_letter_downloaded',
        'offer_letter.closed as offer_letter_closed',
  
        'prequalify_status.status as prequalify_status',
        'prequalify_status.verification as prequalify_verification',
  
        'property_closing.closing_status',
  
        db.raw('COALESCE(json_agg(DISTINCT payments.*) FILTER (WHERE payments.payment_id IS NOT NULL), \'[]\') as payments')
      ])
      .where('properties.id', id)
      .andWhere('properties.is_live', true)
      .leftJoin('offer_letter', 'offer_letter.property_id', 'properties.id')
      .leftJoin('property_closing', 'property_closing.property_id', 'properties.id')
      .leftJoin('payments', 'payments.property_id', 'properties.id')
      .leftJoin('users', 'users.id', 'properties.user_id')
      .leftJoin('prequalify_personal_information', 'prequalify_personal_information.loaner_id', 'users.id')
      .leftJoin('prequalify_status', 'prequalify_status.personal_information_id', 'prequalify_personal_information.personal_information_id')
      .groupBy(
        'properties.id',
        'offer_letter.offer_letter_status',
        'offer_letter.offer_letter_requested',
        'offer_letter.offer_letter_approved',
        'offer_letter.offer_letter_downloaded',
        'offer_letter.closed',
        'prequalify_status.status',
        'prequalify_status.verification',
        'property_closing.closing_status'
      )
      .orderBy('properties.id', 'desc');
  
    if (!['super_admin', 'admin', 'developer'].includes(userRole)) {
      query.select(db.raw('NULL as documents'));
    }
  
    const result = await query.first();
    return result ?? null;
  }
  

  async updateProperty(
    id: string,
    property: Record<string, any>,
  ): Promise<Properties | null> {
    const [updatedProperty] = await db('properties')
      .where({ id })
      .update(property)
      .returning('*')
    return updatedProperty ? new Properties(updatedProperty) : null
  }

  async findPropertiesByPriceRange(
    min: number,
    max: number,
    paginate?: SeekPaginationOption,
  ): Promise<SeekPaginationResult<Properties>> {
    let query = db('properties')
      .whereBetween('property_price', [min, max])
      .select('*')

    if (paginate) {
      const offset = (paginate.page_number - 1) * paginate.result_per_page
      query = query.limit(paginate.result_per_page).offset(offset)
    }

    const results = (await query).map((property) => new Properties(property))

    return new SeekPaginationResult<Properties>({
      result: results,
      page: paginate?.page_number || 1,
      result_per_page: paginate?.result_per_page || results.length,
    })
  }

  async findPropertiesName(property_name: string): Promise<Properties> {
    const property = await db('properties')
      .where('property_name', property_name)
      .first()
    return property ? new Properties(property) : null
  }

  async getAllUserPropertyCount(user_id: string): Promise<PropertyCount> {
    let properties = (await db('properties')
      .select('properties.*')
      .where('properties.user_id', user_id)
      .orderBy('properties.id', 'desc')) as Properties[]

    const queryresp = properties.reduce(
      (acc: PropertyCount, curr: Properties) => {
        return {
          total: acc.total + 1,
          pending: acc.pending + (curr.is_live ? 0 : 1),
          totalViewed: 0,
        }
      },
      { total: 0, pending: 0, totalViewed: 0 },
    )

    return queryresp
  }

  async findPropertiesByUserId(
    user_id: string,
    filters?: PropertyFilters,
  ): Promise<SeekPaginationResult<Properties>> {
    let query = db('properties')
      .select('properties.*')
      .where('properties.user_id', user_id)
      .orderBy('properties.id', 'desc')

    query = this.useFilter(query, filters)

    if (filters) {
      if (filters?.result_per_page && filters?.page_number) {
        const offset = (filters.page_number - 1) * filters.result_per_page
        query = query.limit(filters.result_per_page).offset(offset)
      }
    }

    const results = (await query).map((item) => new Properties(item))

    return new SeekPaginationResult<Properties>({
      result: results,
      page: filters?.page_number || 1,
      result_per_page: filters?.result_per_page || results.length,
    })
  }

  async softDeleteProperty(id: string): Promise<boolean> {
    return await db('properties')
      .where({ id })
      .update({ deleted_at: new Date() })
  }

  async deleteProperty(id: string): Promise<boolean> {
    return await db('properties').where({ id }).delete()
  }

  async addWatchlistProperty(
    property_id: string,
    user_id: string,
  ): Promise<boolean> {
    const [watchlist] = await db('property_watchlist')
      .insert({ property_id, user_id })
      .returning('*')
    return watchlist ? true : false
  }

  async getWatchlistProperty(user_id: string): Promise<Properties[]> {
    const properties = await db('property_watchlist')
      .where('property_watchlist.user_id', user_id)
      .join('properties', 'property_watchlist.property_id', 'properties.id')
      .select(
        'properties.id',
        'properties.property_name',
        'properties.property_price',
        'properties.property_images',
        'properties.property_type',
        'properties.property_description',
        'properties.property_feature',
        'properties.financial_types',
        'properties.landmark',
        'properties.property_condition',
        'properties.numbers_of_bedroom',
        'properties.numbers_of_bathroom',
        'properties.is_live',
        'properties.is_sold',
        'properties.user_id as developer_id',
        'properties.property_size',
        'properties.street_address',
        'properties.city',
        'properties.state',
        'properties.unit_number',
        'properties.landmark',
        'properties.payment_duration',
        'properties.postal_code',
        'properties.created_at',
        'properties.updated_at',
        'properties.deleted_at',
      )

    return properties.map((property) => new Properties(property))
  }

  async getIfWatchListPropertyIsAdded(
    property_id: string,
    user_id: string,
  ): Promise<Properties | null> {
    return await db('property_watchlist')
      .where('property_id', property_id)
      .andWhere('user_id', user_id)
      .first()
  }

  async removeWatchList(
    property_id: string,
    user_id: string,
  ): Promise<boolean> {
    return await db('property_watchlist')
      .where('property_id', property_id)
      .andWhere('user_id', user_id)
      .del()
  }

  async ApproveOrDisApproveProperties(
    property_id: string,
    input: Record<string, any>,
  ): Promise<void | number> {
    const properties = await db('properties')
      .update(input)
      .where('id', property_id)
    return properties
  }

  async getAllPropertiesTobeApproved(
    filters?: PropertyFilters,
  ): Promise<SeekPaginationResult<Properties>> {
    const page = filters?.page_number ?? 1
    const perPage = filters?.result_per_page ?? 10
    const offset = (page - 1) * perPage

    let baseQuery = db('properties').orderBy('properties.id', 'desc')
    baseQuery = this.useFilter(baseQuery, filters)

    const totalQuery = baseQuery.clone().count('* as count').first()
    const [{ count: total }] = await Promise.all([totalQuery])

    const paginatedQuery = baseQuery
      .clone()
      .select('properties.*')
      .limit(perPage)
      .offset(offset)
    const results = await paginatedQuery

    const properties = results.map((item) => new Properties(item))
    const totalPages = Math.ceil(Number(total) / perPage)

    return new SeekPaginationResult<Properties>({
      result: properties,
      page,
      result_per_page: perPage,
      total_records: Number(total),
      total_pages: totalPages,
      next_page: page < totalPages ? page + 1 : null,
      prev_page: page > 1 ? page - 1 : null,
    })
  }
}
