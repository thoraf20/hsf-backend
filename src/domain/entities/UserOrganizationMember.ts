import { OrganizationMemberStatus } from '@domain/enums/organizationEnum'
import { BaseEntity } from '.'
import { UserClientView } from './User'

export class UserOrganizationMember extends BaseEntity {
  user_id: string
  organization_id: string
  role_id: string
  status: OrganizationMemberStatus

  deleted_at?: Date
  suspended_at?: Date

  created_by_user_id?: string
  created_by_user?: UserClientView

  constructor(data: Partial<UserOrganizationMember>) {
    super()
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}
