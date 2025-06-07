import { PropertyApprovalStatus } from '@domain/enums/propertyEnum'

export class Properties {
  id?: string
  property_name: string
  property_type: string
  property_size: string
  property_price: string
  property_description: string
  numbers_of_bedroom: number
  numbers_of_bathroom: number
  property_condition: string
  financial_types: string[]
  property_feature: string[]
  property_images: string[]
  documents: any
  status?: PropertyApprovalStatus
  down_payment_percentage?: number

  organization_id: string
  is_sold?: boolean
  street_address: string
  city: string
  is_live?: boolean
  unit_number: string
  postal_code: string
  landmark: string
  state: string
  listed_by_id?: string
  payment_duration?: string
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date

  constructor(data: Partial<Properties>) {
    let complete_data = {
      ...data,
    }
    if (data) {
      Object.assign(this, complete_data)
    }
  }
}

export class shareProperty {
  recipient_email: string
  sender_email: string
  property_id: string
  message?: string
  shareable_link?: string
  user_id: string
  updated_at?: Date
  deleted_at?: Date

  constructor(data: Partial<shareProperty>) {
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}
