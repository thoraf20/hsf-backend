// Import the Role enum

import { Role } from '../enums/rolesEmun'

export class User  {
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
  role?: Role
  failed_login_attempts?: number
  is_email_verified?: boolean
  is_phone_verified?: boolean
  is_mfa_enabled?: boolean
  is_default_password?: boolean
  constructor(data: Partial<User>) {
    Object.assign(this, {
        created_at: new Date(),
        updated_at: new Date(),
        ...data
    });
}

}

