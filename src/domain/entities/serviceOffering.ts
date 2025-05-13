import { PartialInstantiable } from '@shared/types/partials'

export class ServiceOffering extends PartialInstantiable<ServiceOffering> {
  id?: string
  service_name: string
  description?: string
  base_price: number
  image_url: string
  product_code: string
  currency?: string
  is_active: boolean
  deleted_at?: Date
  deleted_by_id?: string
  created_by_id?: string
  metadata?: Record<string, any>
  created_at?: Date
  updated_at?: Date

  constructor(data: Partial<ServiceOffering>) {
    super(data)
    if (data) {
      Object.assign(this, data)
    }
  }
}
