// Import the Role enum

import { Role } from "../../domain/enums/rolesEmun";

export class User {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  profile?: string;
  role_id?: number;
  password: string;
  image?: string;
  user_agent?: string;
  role?: Role;
  failed_login_attempts?: number;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  is_mfa_enabled?: boolean;
  is_default_password?: boolean
  constructor(data: User) {
    this.id = data.id;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.email = data.email;
    this.phone_number = data.phone_number;
    this.profile = data.profile;
    this.role_id = data.role_id ?? 0;
    this.password = data.password;
    this.image = data.image;
    this.user_agent = data.user_agent;
    this.failed_login_attempts = data.failed_login_attempts ?? 0;
    this.is_email_verified = data.is_email_verified ?? false;
    this.is_phone_verified = data.is_phone_verified ?? false;
    this.is_mfa_enabled = data.is_mfa_enabled ?? false;
    this.role = data.role
    this.is_default_password = data.is_default_password
  }
}


