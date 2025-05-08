export class DeveloperInspectionSlot {
  id: string
  developer_id: string
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
  developer_id: string

  constructor(d: Partial<DeveloperAvailability>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class DeveloperAvailabilitySlot {
  id: string
  developer_availability_id: string
  developer_id: string
  availability_id: string

  constructor(d: Partial<DeveloperAvailabilitySlot>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}
