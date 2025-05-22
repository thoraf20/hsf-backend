import { OrganizationType } from '@domain/enums/organizationEnum'
import { User } from './User'

export class Developer {
  profile_id?: string
  company_name: string
  company_registration_number: string
  office_address: string
  company_email: string
  state: string
  city: string
  developer_role: string
  years_in_business: string
  specialization: string
  organization_id: string
  region_of_operation: string
  company_image: string
  documents: any
  created_at?: Date
  updated_at?: Date

  constructor(data: Partial<Developer>) {
    let complete_data = {
      documents:
        typeof data.documents === 'string'
          ? JSON.stringify(data.documents)
          : Array.isArray(data.documents)
            ? data.documents
            : [],
      ...data,
    }
    if (data) {
      Object.assign(this, complete_data)
    }
  }
}

export type DevelopeReg = Partial<Developer> & Partial<User>

export function getDeveloperClientView(developer: Developer) {
  return {
    id: developer.profile_id,
    name: developer.company_name,
    type: OrganizationType.DEVELOPER_COMPANY,
    office_address: developer.office_address,
    company_email: developer.company_email,
    company_image: developer.company_image,
    specialization: developer.specialization,
    state: developer.state,
    city: developer.city,
    created_at: developer.created_at,
    updated_at: developer.updated_at,
  }
}

export type DeveloperClientView = ReturnType<typeof getDeveloperClientView>
