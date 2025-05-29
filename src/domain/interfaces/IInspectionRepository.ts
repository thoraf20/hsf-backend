import { Properties } from '@domain/entities/Property'
import { Inspection } from '@domain/entities/Inspection'
import {
  SeekPaginationOption,
  SeekPaginationResult,
} from '@shared/types/paginate'
import { Knex } from 'knex'
import { InspectionFilters } from '@validators/inspectionVaidator'

export interface IInspectionRepository {
  createInpection(
    input: Inspection,
    trx?: Knex.Transaction,
  ): Promise<Inspection>
  getAlreadySchedulesInspection(
    property_id: string,
    user_id: string,
  ): Promise<Inspection>

  responseToReschedule(
    inspection_id: string,
    status: Partial<Inspection>,
  ): Promise<Inspection>

  updateScheduleInpection(
    inspectionId: string,
    update: Partial<Inspection>,
  ): Promise<Inspection>
  getAllUserScheduleInspection(
    user_id: string,
    query: string,
    filter?: Record<string, any>,
    paginate?: SeekPaginationOption,
  ): Promise<SeekPaginationResult<Record<string, any>>>

  getAllScheduleInspection(
    filters: InspectionFilters,
  ): Promise<SeekPaginationResult<Inspection>>

  getScheduleInspectionById(
    inspection_id: string,
  ): Promise<Inspection & Properties>
  getSchedulesInspectionForProperty(
    property_ids: string[],
    paginate?: SeekPaginationOption,
  ): Promise<SeekPaginationResult<Inspection>>
}
