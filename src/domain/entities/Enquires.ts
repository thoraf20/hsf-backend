import { PartialEntity } from '@shared/types/partials'

export class Enquires extends PartialEntity<Enquires> {
  id?: string
  property_id: string
  developer_id: string
  closed: boolean
  created_at?: Date
  updated_at?: Date

  constructor(d: Partial<Enquires>) {
    let data = {
      ...d,
      closed: false,
      created_at: new Date(),
      updated_at: new Date(),
    }
    super(data)
    Object.assign(this, d)
  }
}

export class EnquiryMsg extends PartialEntity<EnquiryMsg> {
  id?: string
  enquiry_id: string
  owner_id: string
  message: string
  email: string
  phone: string
  full_name: string
  created_at?: Date
  updated_at?: Date

  constructor(d: Partial<EnquiryMsg>) {
    let data = { ...d, created_at: new Date(), updated_at: new Date() }
    super(data)
    Object.assign(this, data)
  }
}

export type Enquiry = Enquires & { messages: EnquiryMsg[] }
