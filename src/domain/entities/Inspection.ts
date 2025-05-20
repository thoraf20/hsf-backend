// import { PaymentEnum } from '@domain/enums/PaymentEnum'
import { InspectionRescheduleRequestStatusEnum } from '@domain/enums/inspectionEnum'
import {
  InspectionMeetingType,
  InspectionStatus,
  MeetingPlatform,
} from '@domain/enums/propertyEnum'

export class Inspection {
  id?: string
  property_id: string
  inspection_date: string
  inspection_time: string
  full_name: string
  email: string
  contact_number: string
  meeting_platform?: MeetingPlatform
  inspection_meeting_type: InspectionMeetingType
  inspection_fee_paid: boolean
  inspection_status: InspectionStatus
  day_availability_slot_id?: string
  meet_link?: string
  // amount?: string
  user_id: string
  created_at?: Date
  updated_at?: Date
  // payment_type?: PaymentEnum
  constructor(d: Partial<Inspection>) {
    let data = {
      ...d,
      inspection_fee_paid: false,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class InspectionRescheduleRequest {
  id: string
  inspection_id: string
  original_slot_id: string
  proposed_slot_id: string
  proposed_by_user_id: string
  status: InspectionRescheduleRequestStatusEnum
  user_rejection_reason?: string

  constructor(d: Partial<InspectionRescheduleRequest>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

