import db from '@infrastructure/database/knex'
import { IPropertyRepository } from '@domain/interfaces/IPropertyRepository'
import { Properties, shareProperty } from '@domain/entities/Property'
import {
  PropertyCount,
  //@ts-ignore
  propertyStatusFilter,
  SearchType,
  //@ts-ignore
  SortDateBy,
} from '@shared/types/repoTypes'
import {
  SeekPaginationOption,
  SeekPaginationResult,
} from '@shared/types/paginate'
import { Knex } from 'knex'
import omit from '@shared/utils/omit'
import { EscrowMeetingStatus } from '@domain/enums/propertyEnum'
import { EscrowInformationStatus } from '@entities/PropertyPurchase'
import { applyPagination } from '@shared/utils/paginate'
import { PropertyFilters } from '@validators/propertyValidator'

export class PropertyRepository implements IPropertyRepository {
  async createProperties(property: Properties): Promise<Properties> {
    const [newProperty] = await db('properties').insert(property).returning('*')
    return new Properties(newProperty)
  }

  useFilter(
    query: Knex.QueryBuilder<any, any[]>,
    filters?: PropertyFilters,
    tablename = '',
  ) {
    let q = query

    if (filters == null || Object.keys(filters).length < 1) return q

    const createUnion = (searchType: SearchType) =>
      searchType === SearchType.EXCLUSIVE
        ? (q: Knex.QueryBuilder<any, any[]>) => q.and
        : (q: Knex.QueryBuilder<any, any[]>) => q.or

    const add = createUnion(filters.search_type)

    // do not remove this
    // q = q.and.whereRaw(
    //   `( ${filters.search_type == SearchType.EXCLUSIVE ? 'true' : 'false'} `,
    // )
    if (filters.sort_by) {
      switch (filters.sort_by) {
        case SortDateBy.RecentlyAdded:
          q = q.orderBy(tablename + 'created_at', 'desc') // Newest first
          break
        case SortDateBy.LastUpdated:
          q = q.orderBy(tablename + 'updated_at', 'desc') // Recently updated first
          break
        case SortDateBy.Earliest:
          q = q.orderBy(tablename + 'created_at', 'asc') // Oldest first
          break
      }
    }

    if (filters.property_type) {
      const property_types = filters.property_type.split(',')

      const qq = []

      let index = 0
      for (const alt_property_type of property_types) {
        const property_type = alt_property_type.trim()
        if (property_types.length > 1 && index < 1) {
          qq.push('(')
        }
        if (index == 0) {
          qq.push(`${tablename}property_type ILIKE '${property_type}'`)
        } else {
          qq.push(`OR ${tablename}property_type ILIKE '${property_type}' `)
        }
        index++
      }
      if (qq?.[0] == '(') qq.push(')')

      q = add(q).whereRaw(qq.join(' '))
    }

    if (filters.search) {
      q = add(q).whereRaw(
        `( ${tablename}property_name ILIKE '%${filters.search}%'  or ${tablename}property_description ILIKE '%${filters.search}%' )`,
      )
    }

    if (filters.bedrooms) {
      q = add(q).whereRaw(
        `${tablename}numbers_of_bedroom >= '${filters.bedrooms}'`,
      )
    }

    if (filters.bathrooms) {
      q = add(q).whereRaw(
        `${tablename}numbers_of_bathroom >= '${filters.bathrooms}'`,
      )
    }

    if (filters.min_price || filters.max_price) {
      const qq = []
      if (filters.min_price) {
        qq.push(`${tablename}property_price >= ${filters.min_price}`)
      }
      if (filters.max_price) {
        qq.push(`${tablename}property_price <= ${filters.max_price}`)
      }

      const querystring = `( ${qq.join(' and ')} )`

      q = add(q).whereRaw(querystring)
    }

    if (filters.financing_type) {
      const f_types = filters.financing_type
        .split(',')
        .map((i) => `'${i.trim()}'`)
        .join(', ')
      q = add(q).whereRaw(
        `EXISTS ( SELECT 1 FROM unnest(${tablename}financial_types) AS ft WHERE ft ILIKE ANY (ARRAY[${f_types}]) )`,
      )
    }

    if (filters.property_features) {
      const feat = filters.property_features
        .split(',')
        .map((i) => `'${i.trim()}'`)
        .join(', ')
      q = add(q).whereRaw(
        `EXISTS ( SELECT 1 FROM unnest(${tablename}property_feature) AS ft WHERE ft ILIKE ANY (ARRAY[${feat}]) )`,
      )
    }

    if (filters.location) {
      q = add(q).whereRaw(`${tablename}state ILIKE '%${filters.location}%'`)
    }
    // q = q.or.whereRaw(
    //   ` ${filters.search_type == SearchType.EXCLUSIVE ? 'true' : 'false'} )`,
    // )

    return q
  }

  async getAllProperties(
    filters?: PropertyFilters,
    userRole: string = 'guest',
    userId?: string,
  ): Promise<SeekPaginationResult<Properties>> {
    let baseQuery = db('properties')
      .where({ is_live: true })
      .join('users', 'users.id', '=', 'properties.user_id')

    let dataQuery = this.useFilter(
      baseQuery.clone(),
      omit(filters, ['sort_by']), // aggregate function count cant be sorted
      'properties.',
    )
      .select('properties.*')
      .orderBy('properties.id', 'desc') // Apply initial selects and ordering

    // Apply user-specific selects BEFORE pagination
    if (userId) {
      dataQuery = dataQuery.select(
        db.raw(
          `(SELECT EXISTS (\n            SELECT 1 FROM property_watchlist\n            WHERE property_watchlist.property_id = properties.id\n            AND property_watchlist.user_id = ?\n          )) AS is_whitelisted`,
          [userId],
        ),
      )
    }

    if (!['super_admin', 'admin', 'developer'].includes(userRole)) {
      dataQuery = dataQuery.select(db.raw('NULL as documents'))
    }

    // Use shared applyPagination for handling limit, offset, and total count
    const paginationResult = await applyPagination<Properties>(
      dataQuery,
      filters,
    )

    // Map the raw data results within the paginationResult to Properties instances
    const mappedResults = paginationResult.result.map((item: any) => {
      // Apply custom mapping for is_whitelisted if needed, then map to Properties
      const processedItem = {
        ...item,
        is_whitelisted:
          item.is_whitelisted === true || item.is_whitelisted === 't',
      }
      return new Properties(processedItem)
    })

    paginationResult.result = mappedResults
    return paginationResult
  }

  async findPropertyById(
    id: string,
    user_id?: string,
    userRole?: string,
  ): Promise<any> {
    let propertyQuery = db('properties')
      .select([
        'properties.*',
        'offer_letter.offer_letter_status',
        'offer_letter.purchase_type',
        'offer_letter.offer_letter_doc',
        'offer_letter.offer_letter_requested',
        'offer_letter.offer_letter_approved',
        'offer_letter.offer_letter_downloaded',
        'offer_letter.closed as offer_letter_closed',
        'property_closing.closing_status',

        db.raw(`
          COALESCE(
            json_agg(DISTINCT payments.*) FILTER (WHERE payments.payment_id IS NOT NULL),
            '[]'
          ) AS payments
        `),

        db.raw('row_to_json(property_closing) as property_closing'),

        db.raw('row_to_json(inspection) as inspection'),
        db.raw('row_to_json(application) as application'),
        db.raw(`
          COALESCE(
            json_agg(DISTINCT escrow.*) FILTER (WHERE escrow.escrow_id IS NOT NULL),
            '[]'
          ) AS escrow_info
        `),

        db.raw(
          `DATE_PART('day', NOW() - properties.created_at) AS days_posted`,
        ),

        db.raw(`(
          SELECT COUNT(*)
          FROM views
          WHERE views.property_id = properties.id
        ) AS view_count`),

        db.raw(`(
          SELECT COUNT(*)
          FROM shares
          WHERE shares.property_id = properties.id
        ) AS share_count`),
      ])
      .where('properties.id', id)
      .andWhere('properties.is_live', true)
      .leftJoin('offer_letter', 'offer_letter.property_id', 'properties.id')
      .leftJoin(
        'property_closing',
        'property_closing.property_id',
        'properties.id',
      )
      .leftJoin('payments', 'payments.property_id', 'properties.id')
      .leftJoin(
        { escrow: 'escrow_information' },
        'escrow.property_id',
        'properties.id',
      )
      .leftJoin('application', (qb) => {
        qb.on('application.property_id', 'properties.id').andOnVal(
          'application.user_id',
          user_id ?? null,
        )
      })
      .leftJoin('inspection', (qb) =>
        qb
          .on('inspection.property_id', 'properties.id')
          .andOnVal('inspection.user_id', user_id ?? null),
      )
      .groupBy(
        'properties.id',
        'inspection.*',
        'application.*',
        'offer_letter.purchase_type',
        'property_closing.*',
        'offer_letter.offer_letter_status',
        'offer_letter.offer_letter_requested',
        'offer_letter.offer_letter_approved',
        'offer_letter.offer_letter_doc',
        'offer_letter.offer_letter_downloaded',
        'offer_letter.closed',
        'property_closing.closing_status',
      )
      .orderBy('properties.id', 'desc')

    // Hide sensitive documents if user isn't privileged
    if (!['super_admin', 'admin', 'developer'].includes(userRole)) {
      propertyQuery.select(db.raw('NULL AS documents'))
    }

    if (user_id) {
      propertyQuery = propertyQuery.select(
        db.raw(
          `(SELECT EXISTS (
              SELECT 1 FROM property_watchlist
              WHERE property_watchlist.property_id = properties.id
              AND property_watchlist.user_id = ?
            )) AS is_whitelisted`,
          [user_id],
        ),
      )
    }

    // Query for user eligibility
    const eligibilityQuery = user_id
      ? db('prequalify_status')
          .leftJoin(
            'eligibility',
            'prequalify_status.status_id',
            'eligibility.prequalify_status_id',
          )
          .leftJoin('properties', 'eligibility.property_id', 'properties.id')
          .where('properties.id', id)
          .andWhere('eligibility.user_id', user_id)
          .select(
            'prequalify_status.is_prequalify_requested',
            'eligibility.is_eligible',
            'eligibility.eligiblity_status',
            'eligibility.eligibility_id',
          )
          .first()
      : null

    const escrowStatusQuery = db('escrow_status')
      .select('escrow_status', 'is_escrow_set', 'escrow_status_id')
      .where('property_id', id)
      .first()

    let [propertyData, eligibilityData, escrowStatus] = await Promise.all([
      propertyQuery.first(),
      eligibilityQuery,
      escrowStatusQuery,
    ])

    propertyData = {
      ...propertyData,
      is_whitelisted:
        propertyData.is_whitelisted === true ||
        propertyData.is_whitelisted === 't',
    }

    return {
      ...propertyData,
      is_prequalify_requested: eligibilityData?.is_prequalify_requested ?? null,
      is_eligible: eligibilityData?.is_eligible ?? null,
      eligiblity_status: eligibilityData?.eligiblity_status ?? null,
      eligibility_id: eligibilityData?.eligibility_id ?? null,
      escrow_status: escrowStatus ?? null,
    }
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

  async findPropertiesByDeveloperOrg(
    organization_id: string,
    filters?: PropertyFilters,
  ): Promise<SeekPaginationResult<Properties>> {
    let baseQuery = db('properties')
      .where('properties.organization_id', organization_id)
      .orderBy('properties.id', 'desc')

    let dataQuery = this.useFilter(
      baseQuery.clone().groupBy('properties.id'),
      filters,
    )
      .select('properties.*')
      .orderBy('properties.id', 'desc') // Apply initial selects and ordering

    const paginationResult = await applyPagination<Properties>(
      dataQuery,
      filters,
    )

    return paginationResult
  }

  async findPropertiesByHSFAdmin(
    filters?: PropertyFilters,
  ): Promise<SeekPaginationResult<Properties>> {
    let baseQuery = db('properties').orderBy('properties.id', 'desc')

    let dataQuery = this.useFilter(
      baseQuery.clone().groupBy('properties.id'),
      filters,
    ) // Apply filters
      .select('properties.*')
      .orderBy('properties.id', 'desc') // Apply initial selects and ordering

    // Call shared applyPagination which returns SeekPaginationResult<RawData>
    const paginationResult = await applyPagination<Properties>(
      dataQuery,
      filters,
    )
    return paginationResult
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
  ): Promise<Record<string, any>> {
    const [watchlist] = await db('property_watchlist')
      .insert({ property_id, user_id })
      .returning('*')
    return watchlist
  }

  async getWatchlistProperty(
    user_id: string,
    filters?: PropertyFilters,
  ): Promise<SeekPaginationResult<Properties>> {
    const page = filters?.page_number ?? 1
    const perPage = filters?.result_per_page ?? 10
    const offset = (page - 1) * perPage

    // Query to get the total count of properties in the watchlist
    const totalRecordsQuery = db('property_watchlist')
      .where('property_watchlist.user_id', user_id)
      .join('properties', 'property_watchlist.property_id', 'properties.id')
      .count('* as count')
      .first()

    const [{ count: total }] = await Promise.all([totalRecordsQuery])

    // Query to get the properties in the watchlist with pagination
    const propertiesQuery = db('property_watchlist')
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
      .limit(perPage)
      .offset(offset)

    // Fetch the properties
    const rawResult = await propertiesQuery

    const result = rawResult.map((property) => new Properties(property))

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

  public async propertyApplications(
    user_id: string,
    filters?: PropertyFilters,
  ): Promise<SeekPaginationResult<any>> {
    const page = filters?.page_number ?? 1
    const perPage = filters?.result_per_page ?? 10
    const offset = (page - 1) * perPage

    const baseQuery = db('properties')
      .leftJoin('eligibility', function () {
        this.on('eligibility.property_id', '=', 'properties.id').andOn(
          'eligibility.user_id',
          '=',
          db.raw('?', [user_id]),
        )
      })
      .leftJoin(
        'prequalify_status',
        'eligibility.prequalify_status_id',
        'prequalify_status.status_id',
      )
      .leftJoin('payments', function () {
        this.on('payments.property_id', '=', 'properties.id').andOn(
          'payments.user_id',
          '=',
          db.raw('?', [user_id]),
        )
      })
      .leftJoin('offer_letter', 'properties.id', 'offer_letter.property_id')
      .leftJoin('users', 'eligibility.user_id', 'users.id')
      .where(function () {
        this.where('eligibility.user_id', user_id).orWhere(
          'offer_letter.user_id',
          user_id,
        )
      })
      .orderBy('properties.created_at', 'desc')

    // Get total count without order by
    const [{ count: total }] = await baseQuery
      .clone()
      .clearOrder()
      .count('* as count')

    // Apply pagination
    const paginatedResults = await baseQuery
      .clone()
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
        'eligibility.eligibility_id',
        'eligibility.eligiblity_status',
        'eligibility.is_eligible',
        'eligibility.financial_eligibility_type',
        'prequalify_status.is_prequalify_requested',
        'prequalify_status.verification',
        'payments.payment_status',
        'payments.payment_type',
        'payments.amount',
        'payments.transaction_id',
        'offer_letter.offer_letter_id',
        'offer_letter.purchase_type as financial_application_type',
        'users.first_name',
        'users.last_name',
        'users.email',
      )
      .limit(perPage)
      .offset(offset)

    // Format results
    const cleanApplications = paginatedResults.map((app) => {
      const {
        eligibility_id,
        eligiblity_status,
        is_eligible,
        financial_eligibility_type,
        offer_letter_id,
        financial_application_type,
        payment_status,
        payment_type,
        amount,
        transaction_id,
        first_name,
        last_name,
        email,
        ...propertyData
      } = app

      return {
        ...propertyData,
        ...(eligibility_id && {
          eligibility: {
            eligibility_id,
            eligiblity_status,
            is_eligible,
            financial_eligibility_type,
          },
        }),
        ...(offer_letter_id && {
          offer_letter: {
            offer_letter_id,
            financial_application_type,
          },
        }),
        ...(payment_status && {
          payment: {
            payment_status,
            payment_type,
            amount,
            transaction_id,
          },
        }),
        ...(first_name && {
          user: {
            first_name,
            last_name,
            email,
          },
        }),
      }
    })

    const totalPages = Math.ceil(Number(total) / perPage)

    return new SeekPaginationResult<any>({
      result: cleanApplications,
      page,
      result_per_page: perPage,
      total_records: Number(total),
      total_pages: totalPages,
      next_page: page < totalPages ? page + 1 : null,
      prev_page: page > 1 ? page - 1 : null,
    })
  }

  public async shareProperty(input: shareProperty): Promise<void> {
    await db('shares').insert(input).returning('*')
  }

  public async viewProperty(input: Record<string, any>): Promise<void> {
    await db('views').insert(input).returning('*')
  }

  public async findIfUserAlreadyViewProperty(
    property_id: string,
    user_id: string,
  ): Promise<Record<string, null>> {
    return await db('views')
      .where('property_id', property_id)
      .andWhere('user_id', user_id)
      .first()
  }

  public async findSharedProperty(
    property_id: string,
    user_id: string,
  ): Promise<shareProperty> {
    return await db('shares')
      .select('*')
      .where('property_id', property_id)
      .andWhere('user_id', user_id)
      .first()
  }

  async UpdatepropertyClosingRequest(
    input: Record<string, any>,
  ): Promise<void> {
    await db('property_closing')
      .update({ closing_status: 'Approved' })
      .where('property_id', input.property_id)
      .andWhere('user_id', input.user_id)
  }
  async getPropertyById(property_id: string): Promise<Properties> {
    return await db('properties').select('*').where('id', property_id).first()
  }

  public async updateEscrowMeeting(
    property_id: string,
    user_id: string,
    status: EscrowMeetingStatus,
  ): Promise<EscrowInformationStatus> {
    const [updatedEscrowStatus] = await db('escrow_status')
      .update({ is_escrow_set: true, escrow_status: status })
      .where('property_id', property_id)
      .andWhere('user_id', user_id)
      .returning('*')

    return updatedEscrowStatus
  }
}
