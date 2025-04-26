// import { PaymentEnum } from '@domain/enums/PaymentEnum'
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
