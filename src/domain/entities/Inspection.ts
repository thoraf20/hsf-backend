import { PaymentEnum } from '@domain/enums/PaymentEnum'
import { PartialEntity } from '@shared/types/partials'
import {
  FinancialOptionsEnum,
  InspectionMeetingType,
  MeetingPlatform,
} from '@domain/enums/propertyEnum'

export class Inspection extends PartialEntity<Inspection> {
  id?: string
  purchase_plan_type: FinancialOptionsEnum
  property_id: string
  inspection_date: string
  inspection_time: string
  full_name: string
  email: string
  contact_number: string
  meeting_platform?: MeetingPlatform
  inspection_meeting_type: InspectionMeetingType
  inspection_fee_paid: boolean
  meet_link?: string
  amount?: string
  user_id: string
  created_at?: Date
  updated_at?: Date
  payment_type?: PaymentEnum
  constructor(data: Partial<Inspection>) {
    super({ ...data, inspection_fee_paid: false })
  }
}
