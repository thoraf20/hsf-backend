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
  financial_types: any
  property_feature: string[]
  property_images: string[]
  documents: any
  user_id: string
  is_sold?: boolean
  street_address: string
  city: string
  unit_number: string
  postal_code: string
  landmark: string
  state: string
  payment_duration?: string
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date
  constructor(data: Partial<Properties>) {
    Object.assign(this, {
      documents :
      typeof data.documents === 'string'
        ? JSON.stringify(data.documents)
        : Array.isArray(data.documents)
          ? data.documents
          : [],
        created_at: new Date(),
        updated_at: new Date(),
        ...data
    });
}
}


