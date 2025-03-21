export class PropertyDetails {
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
  property_address_id: string
  user_id: string
  is_sold?: boolean
  created_at?: Date
  updated_at?: Date

  constructor(data: PropertyDetails) {
    this.id = data.id
    this.property_name = data.property_name
    this.property_type = data.property_type
    this.property_size = data.property_size
    this.property_price = data.property_price
    this.property_description = data.property_description
    this.numbers_of_bedroom = data.numbers_of_bedroom
    this.numbers_of_bathroom = data.numbers_of_bathroom
    this.property_condition = data.property_condition
    this.financial_types = typeof data.financial_types === 'string'
    ? JSON.parse(data.financial_types)
    : Array.isArray(data.financial_types)
      ? data.financial_types
      : []
    this.property_feature = data.property_feature ?? []
    this.property_images = data.property_images ?? []
    this.property_address_id = data.property_address_id
    this.is_sold = data.is_sold ?? false
    this.created_at = data.created_at
    this.updated_at = data.updated_at
    this.documents =
      typeof data.documents === 'string'
        ? JSON.parse(data.documents)
        : Array.isArray(data.documents)
          ? data.documents
          : []

    this.user_id = data.user_id
  }
}

export class PropertyAddress {
  id?: string
  street_address: string
  city: string
  unit_number: string
  postal_code: string
  landmark: string
  state: string

  constructor(data: PropertyAddress) {
    this.id = data.id
    this.street_address = data.street_address
    this.city = data.city
    this.unit_number = data.unit_number
    this.postal_code = data.postal_code
    this.landmark = data.landmark
    this.state = data.state
  }
}
