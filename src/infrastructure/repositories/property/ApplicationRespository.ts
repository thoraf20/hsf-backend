import { ApplicationStatus } from '@domain/enums/propertyEnum'
import { Application, ApplicationStage } from '@entities/Application'
import db, { createUnion } from '@infrastructure/database/knex'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'
import { TrendResult } from '@shared/types/general.type'
import { SeekPaginationResult } from '@shared/types/paginate'
import { SearchType } from '@shared/types/repoTypes'
import { applyPagination } from '@shared/utils/paginate'
import {
  ApplicationFilters,
  ApplicationStatsFilterInput,
} from '@validators/applicationValidator'
import { Knex } from 'knex'

export class ApplicationRepository implements IApplicationRespository {
  private readonly tableName = 'application'
  private readonly stageTableName = 'application_stages'

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

    if (filters.offer_letter_id) {
      q = add(q).whereRaw(`a.offer_letter_id = '${filters.offer_letter_id}'`)
    }

    return q
  }
  async createApplication(input: Application): Promise<Application> {
    const [application] = await db(this.tableName).insert(input).returning('*')
    return new Application(application) ? application : null
  }

  async getAllApplication(
    filters: ApplicationFilters,
  ): Promise<SeekPaginationResult<Application>> {
    const page = filters?.page_number ?? 1
    const perPage = filters?.result_per_page ?? 10
    const offset = (page - 1) * perPage

    let baseQuery: Knex.QueryBuilder = db('application as a')
      .leftJoin('properties as p', 'a.property_id', 'p.id')
      .orderBy('a.created_at', 'desc')

    baseQuery = this.useFilter(baseQuery, {
      ...filters,
    })

    baseQuery = baseQuery
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

    const paginatedResult = await applyPagination<Application>(
      baseQuery,
      filters,
    )

    paginatedResult.result = await Promise.all(
      paginatedResult.result.map(async (application) => {
        const stages = await db<ApplicationStage>(this.stageTableName)
          .where('application_id', application.application_id)
          .orderBy('entry_time', 'asc')

        application.stages = stages
        return application
      }),
    )

    return paginatedResult
  }

  async getApplicationById(application_id: string): Promise<Application> {
    const application = await db('application as a')
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
      .leftJoin(
        'condition_precedents as cp',
        'cp.id',
        'a.condition_precedent_id',
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
        db.raw(`row_to_json(cp) as condition_precedent`),
        'p.*',
        'a.*',
      )
      .where('a.application_id', application_id)

      .first()

    const stages = await db<ApplicationStage>(this.stageTableName)
      .where('application_id', application.application_id)
      .orderBy('entry_time', 'asc')

    application.stages = stages
    return application
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

    const application = await query.first()

    if (!application) {
      return null
    }

    const stages = await db<ApplicationStage>(this.stageTableName)
      .where('application_id', application.application_id)
      .orderBy('entry_time', 'asc')

    application.stages = stages
    return application
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

  async addApplicationStage(
    applicationId: string,
    stage: ApplicationStage,
  ): Promise<ApplicationStage> {
    const prevStage = await db<ApplicationStage>(this.stageTableName)
      .where({
        application_id: applicationId,
        stage: stage.stage,
        user_id: stage.user_id,
      })
      .first()

    if (prevStage) {
      return prevStage
    }

    const [newStage] = await db<ApplicationStage>(this.stageTableName)
      .insert({
        application_id: applicationId,
        stage: stage.stage,
        entry_time: stage.entry_time,
        exit_time: stage.exit_time,
        additional_info: stage.additional_info,
        user_id: stage.user_id,
      })
      .returning('*')

    return newStage
  }

  async updateApplicationStage(
    applicationStageId: string,
    stage: Partial<ApplicationStage>,
  ): Promise<ApplicationStage> {
    const [updatedStage] = await db(this.stageTableName)
      .where('id', applicationStageId)
      .update(stage)
      .returning('*')

    return updatedStage
  }

  public async getApplicationAnalytics(
    filters: ApplicationStatsFilterInput,
  ): Promise<{
    total_applications: number
    total_applications_trend: TrendResult
    approved_clients: number
    approved_clients_trend: TrendResult
    pending_clients: number
    pending_clients_trend: TrendResult
    declined_clients: number
    declined_clients_trend: TrendResult
    lastest_updated_at: Date | string
  }> {
    const currentWeekStart = db.raw(`NOW() - INTERVAL '7 days'`)
    const previousWeekStart = db.raw(`NOW() - INTERVAL '14 days'`)
    const previousWeekEnd = db.raw(
      `NOW() - INTERVAL '7 days' - INTERVAL '1 microsecond'`,
    )

    let query = db<Application>('application')

    if (filters.organization_id) {
      query = query.where({
        developer_organization_id: filters.organization_id,
      })
    }

    if (filters.lender_id) {
      query = query.innerJoin(
        'eligibility',
        'application.id',
        'eligibility.application_id',
      )
      query = query.where(
        'eligibility.lender_organization_id',
        filters.lender_id,
      )
    }

    const result = await query
      .select<
        {
          total_applications: number
          approved_clients: number
          pending_clients: number
          declined_clients: number
          total_applications_trend: string
          approved_clients_trend: string
          pending_clients_trend: string
          declined_clients_trend: string
          current_week_total_applications: number
          current_week_approved_clients: number
          current_week_pending_clients: number
          current_week_declined_clients: number
          previous_week_total_applications: number
          previous_week_approved_clients: number
          previous_week_pending_clients: number
          previous_week_declined_clients: number
          lastest_updated_at: Date | string
        }[]
      >(
        db.raw(`COUNT(application_id) AS "total_applications"`),
        db.raw(
          `COUNT(application_id) FILTER (WHERE status = ?) AS "approved_clients"`,
          [ApplicationStatus.COMPLETED],
        ),
        db.raw(
          `COUNT(application_id) FILTER (WHERE status = ?) AS "pending_clients"`,
          [ApplicationStatus.PENDING],
        ),
        db.raw(
          `COUNT(application_id) FILTER (WHERE status = ?) AS "declined_clients"`,
          [ApplicationStatus.REJECTED],
        ),
        db.raw(
          `COUNT(application_id) FILTER (WHERE created_at >= ${currentWeekStart}) AS "current_week_total_applications"`,
        ),
        db.raw(
          `COUNT(application_id) FILTER (WHERE status = ? AND created_at >= ${currentWeekStart}) AS "current_week_approved_clients"`,
          [ApplicationStatus.COMPLETED],
        ),
        db.raw(
          `COUNT(application_id) FILTER (WHERE status = ? AND created_at >= ${currentWeekStart}) AS "current_week_pending_clients"`,
          [ApplicationStatus.PENDING],
        ),
        db.raw(
          `COUNT(application_id) FILTER (WHERE status = ? AND created_at >= ${currentWeekStart}) AS "current_week_declined_clients"`,
          [ApplicationStatus.REJECTED],
        ),
        db.raw(
          `COUNT(application_id) FILTER (WHERE created_at >= ${previousWeekStart} AND created_at < ${previousWeekEnd}) AS "previous_week_total_applications"`,
        ),
        db.raw(
          `COUNT(application_id) FILTER (WHERE status = ? AND created_at >= ${previousWeekStart} AND created_at < ${previousWeekEnd}) AS "previous_week_approved_clients"`,
          [ApplicationStatus.COMPLETED],
        ),
        db.raw(
          `COUNT(application_id) FILTER (WHERE status = ? AND created_at >= ${previousWeekStart} AND created_at < ${previousWeekEnd}) AS "previous_week_pending_clients"`,
          [ApplicationStatus.PENDING],
        ),
        db.raw(
          `COUNT(application_id) FILTER (WHERE status = ? AND created_at >= ${previousWeekStart} AND created_at < ${previousWeekEnd}) AS "previous_week_rejected_clients"`,
          [ApplicationStatus.REJECTED],
        ),
        db.raw(`MAX(application.updated_at) AS lastest_updated_at`),
      )
      .first() // Use .first() to get a single row result

    // Ensure all counts are numbers, defaulting to 0 if null/undefined
    const totalApplications = Number(result?.total_applications) || 0
    const approvedClients = Number(result?.approved_clients) || 0
    const pendingClients = Number(result?.pending_clients) || 0
    const declinedClients = Number(result?.declined_clients) || 0

    const currentWeekTotalApplications =
      Number(result?.current_week_total_applications) || 0
    const currentWeekApprovedClients =
      Number(result?.current_week_approved_clients) || 0
    const currentWeekPendingClients =
      Number(result?.current_week_pending_clients) || 0
    const currentWeekDeclinedClients =
      Number(result?.current_week_declined_clients) || 0

    const previousWeekTotalApplications =
      Number(result?.previous_week_total_applications) || 0
    const previousWeekApprovedClients =
      Number(result?.previous_week_approved_clients) || 0
    const previousWeekPendingClients =
      Number(result?.previous_week_pending_clients) || 0
    const previousWeekDeclinedClients =
      Number(result?.previous_week_declined_clients) || 0

    const totalApplicationsTrend = this.calculateTrend(
      currentWeekTotalApplications,
      previousWeekTotalApplications,
    )
    const approvedClientsTrend = this.calculateTrend(
      currentWeekApprovedClients,
      previousWeekApprovedClients,
    )
    const pendingClientsTrend = this.calculateTrend(
      currentWeekPendingClients,
      previousWeekPendingClients,
    )
    const declinedClientsTrend = this.calculateTrend(
      currentWeekDeclinedClients,
      previousWeekDeclinedClients,
    )

    return {
      total_applications: totalApplications,
      total_applications_trend: totalApplicationsTrend,
      approved_clients: approvedClients,
      approved_clients_trend: approvedClientsTrend,
      pending_clients: pendingClients,
      pending_clients_trend: pendingClientsTrend,
      declined_clients: declinedClients,
      declined_clients_trend: declinedClientsTrend,
      lastest_updated_at: result.lastest_updated_at,
    }
  }

  private calculateTrend(
    currentCount: number,
    previousCount: number,
  ): TrendResult {
    let trend: number | 'N/A'
    let trendflow: 'High' | 'Low' | 'Neutral'
    let label: string

    if (previousCount === 0) {
      if (currentCount > 0) {
        trend = 'N/A' // Cannot calculate a meaningful percentage from zero
        trendflow = 'High'
        label = 'Increased significantly'
      } else {
        trend = 0
        trendflow = 'Neutral'
        label = 'No change'
      }
    } else {
      const percentage = ((currentCount - previousCount) / previousCount) * 100
      trend = parseFloat(percentage.toFixed(1)) // Keep one decimal for the number

      if (percentage > 0) {
        trendflow = 'High'
        label = `Higher than last week`
      } else if (percentage < 0) {
        trendflow = 'Low'
        label = `Less than last week`
      } else {
        trendflow = 'Neutral'
        label = 'No change from last week'
      }
    }

    return { trend, trendflow, label }
  }
}
