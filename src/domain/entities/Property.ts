export class PropertyDetails {
    id?: string;
    property_name: string;
    property_type: string;
    property_size: string;
    property_price: string;
    property_description: string;
    numbers_of_bedroom: number;
    numbers_of_bathroom: number;
    property_condition: string;
    financial_options: string[];
    property_feature: string[];
    property_images: string[];
    property_address_id: string;
    is_sold?: boolean;
    created_at?: Date;
    updated_at?: Date;
  
    constructor(data: PropertyDetails) {
      this.id = data.id;
      this.property_name = data.property_name;
      this.property_type = data.property_type;
      this.property_size = data.property_size;
      this.property_price = data.property_price;
      this.property_description = data.property_description;
      this.numbers_of_bedroom = data.numbers_of_bedroom;
      this.numbers_of_bathroom = data.numbers_of_bathroom;
      this.property_condition = data.property_condition;
      this.financial_options = data.financial_options ?? [];
      this.property_feature = data.property_feature ?? [];
      this.property_images = data.property_images ?? [];
      this.property_address_id = data.property_address_id;
      this.is_sold = data.is_sold ?? false;
      this.created_at = data.created_at;
      this.updated_at = data.updated_at;
    }
  }
  
  
  export class PropertyAddress {
    id?: string;
    street_address: string;
    city: string;
    unit_number: string;
    postal_code: string;
    landmark: string;
    state: string;
  
    constructor(data: PropertyAddress) {
      this.id = data.id;
      this.street_address = data.street_address;
      this.city = data.city;
      this.unit_number = data.unit_number;
      this.postal_code = data.postal_code;
      this.landmark = data.landmark;
      this.state = data.state;
    }
  }
  