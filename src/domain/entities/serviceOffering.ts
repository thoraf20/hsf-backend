import { ServiceOfferingComputeType } from '@domain/enums/serviceOfferingEnum'
import { PartialInstantiable } from '@shared/types/partials'

export class ServiceOffering extends PartialInstantiable<ServiceOffering> {
  id?: string
  service_name: string
  description?: string
  percentage?: number
  base_price?: number
  image_url: string
  product_code: string
  compute_type?: ServiceOfferingComputeType
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
