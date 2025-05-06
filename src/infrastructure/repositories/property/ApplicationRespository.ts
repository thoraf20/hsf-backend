import { Application } from '@entities/Application'
import { Properties } from '@entities/Property'
import db from '@infrastructure/database/knex'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'
import { SeekPaginationResult } from '@shared/types/paginate'
import {
  PropertyFilters,
  SearchType,
  SortDateBy,
} from '@shared/types/repoTypes'
import { Knex } from 'knex'

export class ApplicationRepository implements IApplicationRespository {
  private readonly tableName = 'application'

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

    // // do not remove this
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
    // q = q.or.whereRaw(
    //   ` ${filters.search_type == SearchType.EXCLUSIVE ? 'true' : 'false'} )`,
    // )

    return q
  }
  async createApplication(input: Application): Promise<Application> {
    const [application] = await db(this.tableName).insert(input).returning('*')
    return new Application(application) ? application : null
  }

  async getAllUserApplication(
    user_id: string,
    filters?: PropertyFilters,
  ): Promise<SeekPaginationResult<any>> {
    const page = filters?.page_number ?? 1
    const perPage = filters?.result_per_page ?? 10
    const offset = (page - 1) * perPage

    let baseQuery: Knex.QueryBuilder = db('application as a').leftJoin(
      'properties as p',
      'a.property_id',
      'p.id',
    )
    baseQuery = this.useFilter(baseQuery, filters)
    const [{ count: total }] = await baseQuery
      .clone()
      .clearOrder()
      .count('* as count')
    const paginatedResults = await baseQuery
      .clone()
      .select(
        'a.*',
        'p.property_name',
        'p.property_price',
        'p.property_images',
        'p.property_type',
        'p.property_description',
        'p.property_feature',
        'p.financial_types',
        'p.landmark',
        'p.property_condition',
        'p.numbers_of_bedroom',
        'p.numbers_of_bathroom',
        'p.is_live',
        'p.is_sold',
        'p.user_id as developer_id',
        'p.property_size',
        'p.street_address',
        'p.city',
        'p.state',
        'p.unit_number',
        'p.landmark',
        'p.payment_duration',
        'p.postal_code',
        'p.created_at',
        'p.updated_at',
        'p.deleted_at',
        db.raw(`DATE_PART('day', NOW() - a.created_at) AS days_Applied`),
      )
      .limit(perPage)
      .offset(offset)
      .where('a.user_id', user_id)

    const totalPages = Math.ceil(Number(total) / perPage)

    return new SeekPaginationResult<any>({
      result: paginatedResults,
      page,
      result_per_page: perPage,
      total_records: Number(total),
      total_pages: totalPages,
      next_page: page < totalPages ? page + 1 : null,
      prev_page: page > 1 ? page - 1 : null,
    })
  }

  async getApplicationById(application_id: string): Promise<Properties> {
    const result = await db('application as a')
      .leftJoin('properties as p', 'a.property_id', 'p.id')
      .leftJoin(
        'escrow_status as es',
        'a.escrow_status_id',
        'es.escrow_status_id',
      )
      .leftJoin(
        'escrow_information as ei',
        'a.escrow_information_id',
        'ei.escrow_id',
      )
      .leftJoin(
        'property_closing as pc',
        'a.property_closing_id',
        'pc.property_closing_id',
      )
      .leftJoin('prequalify_status as ps', 'a.prequalifier_id', 'ps.status_id')
      .leftJoin(
        'prequalify_personal_information as ppi',
        'ps.personal_information_id',
        'ppi.personal_information_id',
      )
      .leftJoin('eligibility as el', 'a.eligibility_id', 'el.eligibility_id')
      .leftJoin('offer_letter as ol', 'a.offer_letter_id', 'ol.offer_letter_id')
      .leftJoin(
        'document_upload as du',
        'a.document_upload_id',
        'du.document_upload_id',
      )
      .leftJoin(
        'precedent_document_upload as pdu',
        'a.precedent_document_upload_id',
        'pdu.precedent_document_upload_id',
      )
      .leftJoin(
        'replayment_plan as rp',
        'a.payment_date_id',
        'rp.payment_date_id',
      )
      .leftJoin('loan_offer as lo', 'a.loan_offer_id', 'lo.loan_offer_id')
      .leftJoin('dip as dp', 'a.dip_id', 'dp.dip_id')
      .select(
        'es.escrow_status',
        'es.is_escrow_set',
        'pc.closing_status',
        db.raw(`
                    CASE
                        WHEN ppi.personal_information_id IS NOT NULL THEN json_build_object(
                            'ppi', row_to_json(ppi),
                            'prequalify_status', row_to_json(ps),
                            'eligibility', row_to_json(el)
                        )
                        ELSE NULL
                    END as prequalify_personal_information
                `),
        db.raw(`
        CASE
            WHEN es.escrow_status_id IS NOT NULL  THEN json_build_object(
                'escrow_status', row_to_json(es),
                'escrow_meeting_info', row_to_json(ei)
            )
            ELSE NULL
        END as escrow_status_info
        `),
        'ps.*',
        'el.*',
        'ol.*',
        'du.*',
        'pdu.*',
        'rp.*',
        'dp.*',
        'lo.*',
        'p.*',
        'a.*',
      )
      .where('a.application_id', application_id)
      .first()

    return result
  }

  async updateApplication(input: Partial<Application>): Promise<void> {
    await db('application')
      .update(input)
      .where('application_id', input.application_id)
      .andWhere('user_id', input.user_id)
  }

  async getIfApplicationIsRecorded(
    property_id: string,
    user_id: string,
  ): Promise<Application> {
    return await db('application')
      .select('*')
      .where('property_id', property_id)
      .andWhere('user_id', user_id)
      .first()
  }
}
