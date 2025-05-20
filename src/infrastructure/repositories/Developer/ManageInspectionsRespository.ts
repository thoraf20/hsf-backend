import { Inspection, InspectionRescheduleRequest } from '@entities/Inspection'
import { IManageInspectionRepository } from '@interfaces/Developer/IManageInspectionRepository'
import { SeekPaginationResult } from '@shared/types/paginate'
import db from '@infrastructure/database/knex'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import { DayAvailability, DayAvailabilitySlot, schduleTime } from '@entities/Availabilities'

export class ManageInspectionRepository implements IManageInspectionRepository {
  constructor() {}

async getOrganizationAvailability(
    organization_id: string,
  ): Promise<schduleTime[]> {
    const availability = await db<schduleTime>('day_availability as da')
      .leftJoin('day_availability_slot as das', 'da.day_availability_id', 'das.day_availability_id')
      .leftJoin('properties as p', 'da.organization_id', 'p.organization_id')
      .where('da.organization_id', '=', organization_id)
      .distinct(
        'da.day_availability_id',
        'da.time_slot',
        'das.day',
        'das.start_time',
        'das.end_time',
        'das.is_available'
      )
    if (!availability) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Availability not found',
      )
    }
    return availability
  }

async dayAvailability(payload: DayAvailability): Promise<DayAvailability> {
  const [dayAvailability] = await db<DayAvailability>('day_availability')
    .insert(payload)
    .onConflict(['organization_id', 'time_slot']) 
    .merge({
      time_slot: payload.time_slot,
      organization_id: payload.organization_id,
    })
    .returning('*');
    return new DayAvailability(dayAvailability);
}

  async dayAvailabilitySlot(
    payload: DayAvailabilitySlot,
  ): Promise<DayAvailabilitySlot> {
    const [dayAvailabilitySlot] = await db<DayAvailabilitySlot>(
      'day_availability_slot',
    )
      .insert(payload)
      .onConflict(['day_availability_id', 'day']) 
      .merge({
        start_time: payload.start_time,
        end_time: payload.end_time,
        day: payload.day
      })
      .returning('*')
    return new DayAvailabilitySlot(dayAvailabilitySlot)
  }


  async getDayAvailablitySlotById (day_availablity_slot_id: string) : Promise<schduleTime> {
      const availabilities = db<schduleTime>('day_availability_slot as da')
      .where('day_availability_slot_id', day_availablity_slot_id)
      .first()
      if(!availabilities) {
        throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'Availability not found')
      }
      return availabilities
  }

  async getAllInspectionToBeApproved(
    organization_id: string,
    filters?: any,
  ): Promise<SeekPaginationResult<Inspection>> {
    const page = filters?.page_number ?? 1
    const perPage = filters?.result_per_page ?? 10
    const offset = (page - 1) * perPage

    const baseQuery = db<Inspection>('inspection')
      .join('properties', 'inspection.property_id', 'properties.id')
      .where('properties.organization_id', organization_id)
      .select(
        'inspection.id',
        'inspection.full_name',
        'inspection.created_at',
        'inspection.inspection_status',
        'properties.property_name',
        'properties.street_address',
      )
      .orderBy('inspection.created_at', 'desc')
      .limit(perPage)
      .offset(offset)

    const [{ count: total }] = await db('inspection')
      .join('properties', 'inspection.property_id', 'properties.id')
      .where('properties.organization_id', organization_id)
      .count('* as count')

    const paginatedResults = await baseQuery

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

  async getInspectionById(inspection_id: string): Promise<Inspection> {
    const inspection = await db<Inspection>('inspection as i')
      .where('i.id', inspection_id)
      .leftJoin('properties as p', 'i.property_id', 'p.id')
      .leftJoin('users as u', 'i.user_id', 'u.id')
      .leftJoin('roles as r', 'u.role_id', 'r.id')
      .select(
        'i.id',
        'i.full_name',
        'i.email',
        'i.contact_number',
        'i.created_at',
        'r.name as role_name',
        'i.inspection_status',
        'p.property_name',
        'p.street_address',
      )
      .first()
    if (!inspection) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Inspection not found',
      )
    }
    return inspection
  }

  async rescheduleInspection(
    payload: InspectionRescheduleRequest,
  ): Promise<InspectionRescheduleRequest> {
    const [rescheduleRequest] = await db<InspectionRescheduleRequest>(
      'inspection_reschedule_requests',
    )
      .insert(payload)
      .returning('*')

    return new InspectionRescheduleRequest(rescheduleRequest)
  }

  async updateInspectionDetails(
    inspection_id: string,
    details: Partial<Inspection>,
  ): Promise<void> {
    // Implementation for updating inspection details
  }
}
