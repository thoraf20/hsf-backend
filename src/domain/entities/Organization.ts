import { OrganizationType } from '@domain/enums/organizationEnum'
import { BaseEntity } from '.'

export class Organization extends BaseEntity {
  name: string
  type: OrganizationType
  owner_user_id?: string

  constructor(data: Partial<Organization>) {
    super()
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}
