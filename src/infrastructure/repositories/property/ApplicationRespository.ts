import { Application } from '@entities/Application'
import db, { createUnion } from '@infrastructure/database/knex'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'
import { SeekPaginationResult } from '@shared/types/paginate'
import { SearchType } from '@shared/types/repoTypes'
import { ApplicationFilters } from '@validators/applicationValidator'
import { Knex } from 'knex'

export class ApplicationRepository implements IApplicationRespository {
  private readonly tableName = 'application'

  useFilter(
    query: Knex.QueryBuilder<any, any[]>,
    filters?: ApplicationFilters,
    tablename = '',
  ) {
    let q = query

    if (filters == null || Object.keys(filters).length < 1) return q

    const add = createUnion(SearchType.EXCLUSIVE)

    // if (filters.sort_by) {
    //   switch (filters.sort_by) {
    //     case SortDateBy.RecentlyAdded:
    //       q = q.orderBy(tablename + 'created_at', 'desc') // Newest first
    //       break
    //     case SortDateBy.LastUpdated:
    //       q = q.orderBy(tablename + 'updated_at', 'desc') // Recently updated first
    //       break
    //     case SortDateBy.Earliest:
    //       q = q.orderBy(tablename + 'created_at', 'asc') // Oldest first
    //       break
    //   }
    // }

    if (filters.property_type) {
      q = add(q).whereRaw(`p.property_type = ${filters.property_type}`)
    }

    if (filters.search) {
      q = add(q).whereRaw(
        `( p.property_name ILIKE '%${filters.search}%'  or p.property_description ILIKE '%${filters.search}%' )`,
      )
    }

    if (filters.organization_id) {
      q = add(q).whereRaw(
        db.raw(`p.organization_id = '${filters.organization_id}'`),
      )
    }

    if (filters.user_id) {
      q = add(q).whereRaw(`a.user_id = '${filters.user_id}'`)
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

    if (filters.lender_id) {
      q = add(q).whereRaw(`e.lender_id = '${filters.lender_id}'`)
    }

    if (filters.status) {
      q = add(q).whereRaw(`p.status = '${filters.status}'`)
    }

    return q
  }
  async createApplication(input: Application): Promise<Application> {
    const [application] = await db(this.tableName).insert(input).returning('*')
    return new Application(application) ? application : null
  }

  async getAllApplication(
    filters?: ApplicationFilters,
  ): Promise<SeekPaginationResult<Application>> {
    const page = filters?.page_number ?? 1
    const perPage = filters?.result_per_page ?? 10
    const offset = (page - 1) * perPage

    let baseQuery: Knex.QueryBuilder = db('application as a').leftJoin(
      'properties as p',
      'a.property_id',
      'p.id',
    )

    baseQuery = this.useFilter(baseQuery, {
      ...filters,
    })
    const [{ count: total }] = await baseQuery
      .clone()
      .clearOrder()
      .count('* as count')
    const paginatedResults = await baseQuery
      .clone()
      .select(
        'a.*',
        db.raw(`
            json_build_object(
            'id', u.id,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'image', u.image,
            'role', r.name,
            'status', u.status,
            'role_id', u.role_id,
            'email', u.email,
            'created_at', u.created_at
           ) as buyer
          `),
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
        'p.organization_id',
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
      .innerJoin('organizations', 'p.organization_id', 'organizations.id')
      .innerJoin(
        'developers_profile',
        'developers_profile.organization_id',
        'p.organization_id',
      )

      .leftJoin('users as u', 'u.id', 'a.user_id')
      .leftJoin('organizations as o', 'a.developer_organization_id', 'o.id')
      .leftJoin('roles as r', 'r.id', 'u.role_id')
      .leftJoin('eligibility as e', 'e.eligibility_id', 'a.eligibility_id')
      .limit(perPage)
      .offset(offset)

    const totalPages = Math.ceil(Number(total) / perPage)

    return new SeekPaginationResult<Application>({
      result: paginatedResults,
      page,
      result_per_page: perPage,
      total_records: Number(total),
      total_pages: totalPages,
      next_page: page < totalPages ? page + 1 : null,
      prev_page: page > 1 ? page - 1 : null,
    })
  }

  async getApplicationById(application_id: string): Promise<Application> {
    const result = await db('application as a')
      .leftJoin('properties as p', 'a.property_id', 'p.id')
      .innerJoin('organizations', 'p.organization_id', 'organizations.id')
      .innerJoin(
        'developers_profile',
        'developers_profile.organization_id',
        'p.organization_id',
      )
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
      .leftJoin('users as u', 'u.id', 'a.user_id')
      .leftJoin('roles as r', 'r.id', 'u.role_id')
      .leftJoin(
        'property_closing as pc',
        'a.property_closing_id',
        'pc.property_closing_id',
      )
      .leftJoin('eligibility as el', 'a.eligibility_id', 'el.eligibility_id')
      .leftJoin(
        'prequalification_inputs as pqi',
        'el.prequalifier_input_id',
        'pqi.id',
      )
      .leftJoin('offer_letter as ol', 'a.offer_letter_id', 'ol.offer_letter_id')
      .leftJoin('loan_offers as lo', 'a.loan_offer_id', 'lo.id')
      .leftJoin('loan_decisions as ld', 'ld.loan_offer_id', 'lo.id')
      .leftJoin('dip as dp', (qb) => {
        // qb.on('dp.dip_id', 'dp.dip_id')
        qb.on('dp.eligibility_id', 'el.eligibility_id').andOn(
          'a.application_id',
          'dp.application_id',
        )
      })
      .and.select(
        'es.escrow_status',
        'es.is_escrow_set',
        'pc.closing_status',
        db.raw('row_to_json(dp) as dip'),
        db.raw(`
                    CASE
                        WHEN pqi.id IS NOT NULL THEN json_build_object(
                            'prequalification_input', row_to_json(pqi),
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
        db.raw(`
            json_build_object(
            'id', u.id,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'image', u.image,
            'role', r.name,
            'status', u.status,
            'role_id', u.role_id,
            'email', u.email,
            'created_at', u.created_at
           ) as buyer
          `),
        db.raw(`row_to_json(lo) as loan_offer`),
        db.raw(`row_to_json(ol) as offer_letter`),
        db.raw(`row_to_json(pc) as property_closing`),
        db.raw(`row_to_json(dp) as dip`),
        db.raw(`row_to_json(ld) as loan_decision`),
        'p.*',
        'a.*',
      )
      .where('a.application_id', application_id)

      .first()

    return result
  }

  async getByUniqueID(
    ids: Pick<
      Application,
      | 'eligibility_id'
      | 'property_closing_id'
      | 'loan_offer_id'
      | 'offer_letter_id'
    >,
  ): Promise<Application> {
    let query = db('application as a')
      .leftJoin('properties as p', 'a.property_id', 'p.id')
      .innerJoin('organizations', 'p.organization_id', 'organizations.id')
      .innerJoin(
        'developers_profile',
        'developers_profile.organization_id',
        'p.organization_id',
      )
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
      .leftJoin('users as u', 'u.id', 'a.user_id')
      .leftJoin('roles as r', 'r.id', 'u.role_id')
      .leftJoin(
        'property_closing as pc',
        'a.property_closing_id',
        'pc.property_closing_id',
      )
      .leftJoin('eligibility as el', 'a.eligibility_id', 'el.eligibility_id')
      .leftJoin(
        'prequalification_inputs as pqi',
        'el.prequalifier_input_id',
        'pqi.id',
      )
      .leftJoin('offer_letter as ol', 'a.offer_letter_id', 'ol.offer_letter_id')
      .leftJoin('loan_offers as lo', 'a.loan_offer_id', 'lo.id')
      .leftJoin('dip as dp', 'a.dip_id', 'dp.dip_id')
      .select(
        'es.escrow_status',
        'es.is_escrow_set',
        'pc.closing_status',
        db.raw('row_to_json(dp) as dip'),
        db.raw(`
                    CASE
                        WHEN pqi.id IS NOT NULL THEN json_build_object(
                            'prequalification_input', row_to_json(pqi),
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
        db.raw(`
            json_build_object(
            'id', u.id,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'image', u.image,
            'role', r.name,
            'status', u.status,
            'role_id', u.role_id,
            'email', u.email,
            'created_at', u.created_at
           ) as buyer
          `),
        db.raw(`row_to_json(lo) as loan_offer`),
        db.raw(`row_to_json(ol) as offer_letter`),
        db.raw(`row_to_json(pc) as property_closing`),
        db.raw(`row_to_json(dp) as dip`),
        'p.*',
        'a.*',
      )

    const uniqueIdEntries = Object.entries(ids)

    if (!uniqueIdEntries.length) {
      throw new Error('No unique ID provided to query application')
    }

    uniqueIdEntries.forEach(([field, value], index) => {
      if (index === 0) {
        query = query.where(`a.${field}`, value)
      } else {
        query = query.andWhere(`a.${field}`, value)
      }
    })

    return query.first()
  }

  async updateApplication(input: Partial<Application>): Promise<void> {
    await db('application')
      .update(input)
      .where('application_id', input.application_id)
  }

  async getLastApplicationIfExist(
    property_id: string,
    user_id: string,
  ): Promise<Application> {
    return await db('application')
      .select('*')
      .where('property_id', property_id)
      .andWhere('user_id', user_id)
      .orderBy('created_at', 'desc')
      .first()
  }
}
