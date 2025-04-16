import { PurchaseEnum } from '@domain/enums/propertyEnum'

export class Application {
  application_type: PurchaseEnum
  escrow_information_id?: string
  escrow_status_id?: string
  prequalifier_id?: string
  property_closing_id?: string
  created_at?: Date
  updated_at?: Date
  constructor(d: Partial<Application>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}
