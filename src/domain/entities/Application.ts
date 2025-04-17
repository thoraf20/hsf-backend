

export class Application {
  application_type?: string
  offer_letter_id?: string
  escrow_information_id?: string
  escrow_status_id?: string
  prequalifier_id?: string
  property_id?: string;
  user_id?: string;
  property_closing_id?: string
  created_at?: Date
  updated_at?: Date
  eligibility_id? : string
  constructor(d: Partial<Application>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}
