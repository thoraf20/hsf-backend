// Import the Role enum

import { AddressType, UserStatus } from '@domain/enums/userEum'
import { Role } from '../enums/rolesEmun'
import { BaseEntity } from '.'
import { Organization } from './Organization'
import { UserOrganizationMember } from './UserOrganizationMember'
import { Account } from './Account'

export class User extends BaseEntity {
  first_name: string
  last_name: string
  email?: string
  phone_number: string
  profile?: string
  role_id?: string
  password: string
  image?: string
  user_agent?: string
  is_admin: boolean
  user_id?: string
  role?: Role
  status: UserStatus
  membership?: UserOrganizationMember & {
    organization: Organization
    role: { id: string; name: string }
  }
  accounts?: Array<Account>
  failed_login_attempts?: number
  force_password_reset?: boolean
  ip_address?: string
  mfa_totp_secret?: string
  require_authenticator_mfa?: boolean
  last_logged_in_at?: Date
  os?: string
  browser?: string
  is_email_verified?: boolean
  is_phone_verified?: boolean
  is_mfa_enabled?: boolean
  is_default_password?: boolean
  constructor(data: Partial<User>) {
    super()
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}

export class AgentProfile {
  id?: string
  street_address: string
  city: string
  state: string
  landmark?: string
  country?: string
  user_id: string
  constructor(data: Partial<User>) {
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}

export class invitation {
  id?: string
  invite_code: string
}

export type UserRegProfile = User & AgentProfile

export class RecoveryCode {
  id: string
  code: string
  used: boolean
  user_id: string
  constructor(data: Partial<RecoveryCode>) {
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}

export function getUserClientView(
  user: User,
): Pick<
  User,
  | 'id'
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'phone_number'
  | 'is_mfa_enabled'
  | 'is_email_verified'
  | 'is_phone_verified'
  | 'is_default_password'
  | 'user_id'
  | 'status'
  | 'require_authenticator_mfa'
  | 'role'
  | 'role_id'
  | 'image'
  | 'profile'
  | 'ip_address'
  | 'last_logged_in_at'
  | 'failed_login_attempts'
  | 'user_agent'
  | 'os'
  | 'force_password_reset'
  | 'created_at'
  | 'updated_at'
> {
  return {
    id: user.id,
    user_id: user.user_id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone_number: user.phone_number,
    is_default_password: user.is_default_password,
    is_email_verified: user.is_email_verified,
    is_phone_verified: user.is_phone_verified,
    status: user.status,
    image: user.image,
    role: user.role,
    role_id: user.role_id,
    profile: user.profile,
    force_password_reset: user.force_password_reset,
    ip_address: user.ip_address,
    is_mfa_enabled: user.is_mfa_enabled,
    last_logged_in_at: user.last_logged_in_at,
    require_authenticator_mfa: user.require_authenticator_mfa,
    failed_login_attempts: user.failed_login_attempts,
    user_agent: user.user_agent,
    os: user.os,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }
}

export type UserClientView = ReturnType<typeof getUserClientView>

export class UserRole extends BaseEntity {
  name: string

  constructor(data: Partial<UserRole>) {
    super()
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}

export class UserPermission extends BaseEntity {
  name: string
  constructor(data: Partial<UserPermission>) {
    super()
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}

export class UserRolePermission extends BaseEntity {
  role_id: string
  permission_id: string

  constructor(data: Partial<UserRolePermission>) {
    super()
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}

export class Address extends BaseEntity {
  street_address: string
  city: string
  state: string
  country: string
  postal_code?: string
  address_type?: AddressType
  user_id?: string

  constructor(data: Partial<Address>) {
    super()
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}
