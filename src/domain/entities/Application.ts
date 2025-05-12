import {
  ApplicationPurchaseType,
  ApplicationStatus,
} from '@domain/enums/propertyEnum'

export class Application {
  application_id?: string
  application_type?: ApplicationPurchaseType
  mortage_payment_status_id?: string
  offer_letter_id?: string
  escrow_information_id?: string
  inspection_id?: string
  escrow_status_id?: string
  prequalifier_id?: string
  payment_date_id?: string
  property_id?: string
  precedent_document_upload_id?: string
  status: ApplicationStatus
  user_id?: string
  document_upload_id?: string
  property_closing_id?: string
  loan_offer_id?: string

  dip_id?: string
  created_at?: Date
  updated_at?: Date
  eligibility_id?: string
  constructor(d: Partial<Application>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}
