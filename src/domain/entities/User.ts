// Import the Role enum

import { UserStatus } from '@domain/enums/userEum'
import { Role } from '../enums/rolesEmun'

export class User {
  id?: string
  first_name: string
  last_name: string
  email?: string
  phone_number: string
  profile?: string
  role_id?: string
  password: string
  image?: string
  user_agent?: string
  user_id?: string
  role?: Role
  status: UserStatus
  failed_login_attempts?: number
  force_password_reset?: boolean
  ip_address?: string
  mfa_totp_secret?: string
  require_authenticator_mfa?: boolean
  recovery_codes?: Array<string>
  last_logged_in_at?: Date
  os?: string
  browser?: string
  is_email_verified?: boolean
  is_phone_verified?: boolean
  is_mfa_enabled?: boolean
  is_default_password?: boolean
  constructor(data: Partial<User>) {
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
