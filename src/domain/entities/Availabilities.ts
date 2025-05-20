export enum DayOfWeekEnum {
  SUNDAY = 'Sunday',
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
  SATURDAY = 'Saturday',
}

export class DayAvailabilitySlot { 
  day_availability_slot_id?: string
  day: DayOfWeekEnum
  start_time: Date
  end_time: Date
  is_available: boolean
 day_availability_id: string
  constructor(d: Partial<DayAvailabilitySlot >) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class DayAvailability {
  day_availability_id?: string
  time_slot: string
  organization_id: string
  constructor(d: Partial<DayAvailability>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}


export type schduleTime = DayAvailability & DayAvailabilitySlot