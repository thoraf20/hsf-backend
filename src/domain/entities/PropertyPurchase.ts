import {
  ApplicationPurchaseType,
  PropertyClosingStatus,
} from '@domain/enums/propertyEnum'

export class OfferLetter {
  offer_letter_id?: string
  offer_letter_doc?: string
  offer_letter_requested?: boolean
  offer_letter_approved?: boolean
  offer_letter_downloaded?: boolean
  purchase_type: ApplicationPurchaseType
  closed?: string
  offer_letter_status?: string
  assigned_user_id?: string
  approved_at?: Date
  reference_id?: string
  review_request_id?: string
  property_id: string
  user_id: string
  updated_at?: Date
  deleted_at?: Date
  constructor(data: Partial<OfferLetter>) {
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}

export class PropertyClosing {
  property_closing_id?: string
  closing_status?: PropertyClosingStatus
  property_id: string
  user_id: string
  updated_at?: Date
  deleted_at?: Date
  constructor(data: Partial<PropertyClosing>) {
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}

export class EscrowInformationStatus {
  escrow_status_id?: string
  escrow_status?: string
  is_escrow_set?: boolean
  property_id?: string
  escrow_information_id?: string
  user_id?: string
  created_at?: Date
  updated_at?: Date
  constructor(data: Partial<EscrowInformationStatus>) {
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}
