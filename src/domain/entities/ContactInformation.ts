import { BaseEntity } from '.'

export class ContactInformation extends BaseEntity {
  user_id: string

  email: string
  country_code: string
  contact_number: string

  // Emergency Contact Information
  emergency_name: string
  emergency_relationship: string
  emergency_contact: string
  emergency_address: string

  constructor(data: Partial<ContactInformation>) {
    super()
  }
}
