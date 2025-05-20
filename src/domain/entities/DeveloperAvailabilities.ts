export class DeveloperInspectionSlot {
  id: string
  organisation_id: string
  property_id: string
  start_time: Date
  end_time: Date
  day_availability_slot_id: string
  status: string
  booked_inspection_id: string
  constructor(d: Partial<DeveloperInspectionSlot>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class DeveloperAvailability {
  id: string
  timeGap: number
  organisation_id: string

  constructor(d: Partial<DeveloperAvailability>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}
