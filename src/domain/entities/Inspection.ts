import { FinancialOptionsEnum, InspectionMeetingType, MeetingPlatform } from "../../domain/enums/propertyEnum";

export class Inspection {
  id?: string;
  purchase_plan_type: FinancialOptionsEnum;
  property_id: string;
  inspection_date: string;
  inspection_time: string;
  full_name: string;
  email: string;
  contact_number: string;
  meeting_platform?: MeetingPlatform;
  inspection_meeting_type: InspectionMeetingType;
  inspection_fee_paid: boolean;
  meet_link?: string;
  amount?: string;
  user_id: string;
  created_at?: Date;
  updated_at?: Date;

  constructor(data: Partial<Inspection>) {
      Object.assign(this, {
          inspection_fee_paid: false,
          created_at: new Date(),
          updated_at: new Date(),
          ...data
      });
  }
}
