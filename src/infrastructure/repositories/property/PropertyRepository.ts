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
      .innerJoin(
        'organizations',
        'properties.organization_id',
        'organizations.id',
      )
      .innerJoin(
        'developers_profile',
        'developers_profile.organization_id',
        'properties.organization_id',
      )

    // Apply filters using the useFilter function
    let dataQuery = this.useFilter(baseQuery.clone(), filters, 'properties.')

    // Select the necessary fields
    dataQuery = dataQuery.select(
      [
        'properties.*',
        userId
          ? db.raw(
              `(SELECT EXISTS (
                   SELECT 1 FROM property_watchlist
                   WHERE property_watchlist.property_id = properties.id
                   AND property_watchlist.user_id = ?
               )) AS is_whitelisted`,
              [userId],
            )
          : undefined,
        db.raw(`
                json_build_object(
                    'id', organizations.id,
                    'name', developers_profile.company_name,
                    'type', organizations.type,
                    'office_address', developers_profile.office_address,
                    'company_email', developers_profile.company_email,
                    'company_image', developers_profile.company_image,
                    'specialization', developers_profile.specialization,
                    'state', developers_profile.state,
                    'city', developers_profile.city,
                    'created_at', developers_profile.created_at,
                    'updated_at', developers_profile.updated_at
                ) as developer
            `),
      ].filter(Boolean),
    )

    // Group by property id.
    dataQuery = dataQuery.groupBy(
      'properties.id',
      'organizations.id',
      'developers_profile.profile_id',
    )
    // Order the results
    dataQuery = dataQuery.orderBy('properties.id', 'desc')

    // Apply pagination
    const paginationResult = await applyPagination<Properties>(
      dataQuery,
      filters,
    )

    // Map the results
    const mappedResults = paginationResult.result.map((item: any) => ({
      ...item,
      is_whitelisted: item?.is_whitelisted === true,
    }))
    paginationResult.result = mappedResults

    return paginationResult
  }

  async findPropertyByUser(id: string, user_id?: string): Promise<any> {
    let propertyQuery = db('properties')
      .select([
        'properties.*',
        db.raw('row_to_json(inspection) as inspection'),
        db.raw('row_to_json(application) as application'),
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
        db.raw(
          `(SELECT EXISTS (
              SELECT 1 FROM property_watchlist
              WHERE property_watchlist.property_id = properties.id
              AND property_watchlist.user_id = ?
            )) AS is_whitelisted`,
          [user_id ?? null],
        ),
      ])
      .where('properties.id', id)
      .andWhere('properties.is_live', true)
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
      .groupBy('properties.id', 'inspection.id', 'application.application_id')
      .orderBy('properties.id', 'desc')
      .first()

    return propertyQuery
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

  async getAllUserPropertyCount(
    organization_id: string,
    filters?: { listed_by?: string },
  ): Promise<PropertyCount> {
    let baseQuery = db<Properties>('properties')
      .select<Properties[]>('properties.*')
      .where('properties.organization_id', organization_id)

    if (filters?.listed_by) {
      baseQuery = baseQuery.andWhere(
        'properties.listed_by_id',
        filters.listed_by,
      )
    }
    let properties = await baseQuery

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
      .innerJoin(
        'organizations',
        'properties.organization_id',
        'organizations.id',
      )
      .innerJoin(
        'developers_profile',
        'developers_profile.organization_id',
        'properties.organization_id',
      )
      .select(
        'properties.*',
        db.raw(
          `json_build_object(
          'id', organizations.id,
          'name', developers_profile.company_name,
          \'type\', organizations.type,
          \'office_address\', developers_profile.office_address,
          'company_email', developers_profile.company_email,
          'company_image', developers_profile.company_image,
          'specialization', developers_profile.specialization,
          'state', developers_profile.state,
          'city', developers_profile.city,
          'created_at', developers_profile.created_at,
          'updated_at', developers_profile.updated_at
          )as developer`,
        ),
      )
      .where('properties.organization_id', organization_id)
      .groupBy(
        'properties.id',
        'organizations.id',
        'developers_profile.profile_id',
      )

    let dataQuery = this.useFilter(baseQuery.clone(), filters).orderBy(
      'properties.id',
      'desc',
    ) // Apply initial selects and ordering

    const paginationResult = await applyPagination<Properties>(
      dataQuery,
      filters,
    )

    return paginationResult
  }

  async findPropertiesByHSFAdmin(
    filters?: PropertyFilters,
  ): Promise<SeekPaginationResult<Properties>> {
    let baseQuery = db('properties')
      .innerJoin(
        'organizations',
        'properties.organization_id',
        'organizations.id',
      )
      .leftJoin(
        'developers_profile',
        'developers_profile.organization_id',
        'properties.organization_id',
      )
      .select(
        'properties.*',
        db.raw(
          `json_build_object(
          'id', organizations.id,
          'name', developers_profile.company_name,
          \'type\', organizations.type,
          \'office_address\', developers_profile.office_address,
          'company_email', developers_profile.company_email,
          'company_image', developers_profile.company_image,
          'specialization', developers_profile.specialization,
          'state', developers_profile.state,
          'city', developers_profile.city,
          'created_at', developers_profile.created_at,
          'updated_at', developers_profile.updated_at
          )as developer`,
        ),
      )
      .groupBy(
        'properties.id',
        'organizations.id',
        'developers_profile.profile_id',
      )

    let dataQuery = this.useFilter(
      baseQuery.clone().groupBy('properties.id'),
      filters,
    ) // Apply filters
      .orderBy('properties.created_at', 'desc') // Apply initial selects and ordering

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
        'properties.organization_id as developer_organization_id',
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
        'properties.organization_id as developer_organization_id',
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
