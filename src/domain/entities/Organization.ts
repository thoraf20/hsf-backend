import {
  OrganizationStatus,
  OrganizationType,
} from '@domain/enums/organizationEnum'
import { BaseEntity } from '.'

export class Organization extends BaseEntity {
  name: string
  type: OrganizationType
  status: OrganizationStatus
  owner_user_id?: string
  org_reg_no?: string
  org_reg_no_verified?: Date

  // Contact Information
  contact_email?: string
  contact_phone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string

  // Branding
  logo_url?: string
  primary_color?: string

  // Dates
  approval_date?: Date
  suspension_date?: Date
  deletion_date?: Date

  constructor(data: Partial<Organization>) {
    super()
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}
