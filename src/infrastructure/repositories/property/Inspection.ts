import { Properties } from '@domain/entities/Property'
import { Inspection } from '@domain/entities/Inspection'
import { IInspectionRepository } from '@domain/interfaces/IInspectionRepository'
import db, { createUnion } from '@infrastructure/database/knex'
import {
  SeekPaginationOption,
  SeekPaginationResult,
} from '@shared/types/paginate'
import { Knex } from 'knex'
import { InspectionFilters } from '@validators/inspectionVaidator'
import { SearchType } from '@shared/types/repoTypes'
import { applyPagination } from '@shared/utils/paginate'

export class InspectionRepository implements IInspectionRepository {
  async createInpection(
    inspection: Inspection,
    trx?: Knex.Transaction,
  ): Promise<Inspection> {
    const query = trx || db
    const [newInspection] = await query('inspection')
      .insert({
        ...inspection,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*')

    return new Inspection(newInspection)
  }

  async getAlreadySchedulesInspection(
    property_id: string,
    user_id: string,
  ): Promise<Inspection | null> {
    const foundInspection = await db('inspection')
      .where({ property_id, user_id })
      .first()
    return foundInspection ? new Inspection(foundInspection) : null
  }

  async getSchedulesInspectionForProperty(
    property_ids: string[],
    paginate?: SeekPaginationOption,
  ): Promise<SeekPaginationResult<Inspection>> {
    if (property_ids.length < 1) {
      return new SeekPaginationResult<Inspection>({
        result: [],
        page: 1,
        result_per_page: 0,
      })
    }
    let query = db('inspection')
    let index = 0
    for (var property_id of property_ids) {
      if (index == 0) {
        query = query.where({ property_id })
      } else {
        query = query.and.where({ property_id })
      }
      index++
    }
    query = query.select('*')

    if (paginate) {
      const offset = (paginate.page_number - 1) * paginate.result_per_page
      query = query.limit(paginate.result_per_page).offset(offset)
    }
    const results = await query.then((inspections) =>
      inspections.map((inspection) => new Inspection(inspection)),
    )

    return new SeekPaginationResult<Inspection>({
      result: results,
      page: paginate?.page_number || 1,
      result_per_page: paginate?.result_per_page || results.length,
    })
  }

  async getAllUserScheduleInspection(
    user_id: string,
    query_param?: string,
    filter?: Record<string, any>,
    paginate?: SeekPaginationOption,
  ): Promise<SeekPaginationResult<Record<string, any>>> {
    let query = db('inspection')
      .select(
        'inspection.id as inspection_id',
        'inspection.user_id as home_buyer_id',
        'inspection.*',
        'properties.id as property_id',
        'properties.property_name',
        'properties.street_address',
        'inspection.inspection_date',
        'properties.organization_id',
      )
      .join('properties', 'inspection.property_id', 'properties.id')
      .join('users', 'inspection.user_id', 'users.id')
      .where('inspection.user_id', user_id)
    // .andWhere('inspection.action', '=', query_param)

    if (paginate) {
      const offset = (paginate.page_number - 1) * paginate.result_per_page
      query = query.limit(paginate.result_per_page).offset(offset)
    }

    const results: Record<string, any>[] = await query

    return new SeekPaginationResult<Record<string, any>>({
      result: results,
      page: paginate?.page_number || 1,
      result_per_page: paginate?.result_per_page,
    })
  }

  useFilters(q: Knex.QueryBuilder<any, any[]>, filters: InspectionFilters) {
    const add = createUnion(SearchType.EXCLUSIVE)

    if (filters.organization_id) {
      q = add(q).whereRaw(`p.organization_id = '${filters.organization_id}'`)
    }

    if (filters.user_id) {
      q = add(q).whereRaw(`i.user_id = '${filters.user_id}'`)
    }

    if (filters.status) {
      q = add(q).whereRaw(`i.inspection_status = '${filters.status}'`)
    }
    return q
  }

  async getAllScheduleInspection(
    filters: InspectionFilters,
  ): Promise<SeekPaginationResult<Inspection>> {
    let query = db('inspection as i')
      .select(
        'i.*',
        'i.id as inspection_id',
        'i.user_id as home_buyer_id',
        'properties.id as property_id',
        'properties.property_name',
        'properties.street_address',
        'inspection.inspection_date',
        'properties.organization_id',
      )
      .join('properties as p', 'i.property_id', 'p.id')
      .leftJoin('users as u', 'i.user_id', 'u.id')

    query = this.useFilters(query, filters)

    return applyPagination(query, filters)
  }

  async getScheduleInspectionById(
    inspection_id: string,
  ): Promise<(Inspection & Properties) | null> {
    const inspection = await db<Inspection>('inspection')
      .select(
        'inspection.id as inspection_id',
        'inspection.user_id as home_buyer_id',
        'inspection.*',
        'properties.id as property_id',
        'properties.*',
        'inspection.inspection_date',
        'properties.organization_id',
      )
      .join('properties', 'inspection.property_id', 'properties.id')
      .join('users', 'inspection.user_id', 'users.id')
      .where('inspection.id', inspection_id)
      .first()

    if (!inspection) return null

    return {
      ...new Inspection(inspection),
      ...new Properties(inspection),
    }
  }
  async responseToReschedule(
    inspection_id: string,
    status: Partial<Inspection>,
  ): Promise<Inspection> {
    const [updated] = await db<Inspection>('inspection')
      .update(status)
      .where('id', inspection_id)
      .returning('*')
    return updated
  }

  async updateScheduleInpection(
    inspectionId: string,
    update: Partial<Inspection>,
  ): Promise<Inspection> {
    const [updated] = await db<Inspection>('inspection')
      .update(update)
      .where({ id: inspectionId })
      .returning('*')
    return updated
  }
}
