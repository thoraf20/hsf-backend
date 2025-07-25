export enum CacheEnumKeys {
  EMAIL_VERIFICATION_KEY = `email_verification`,
  PASSWORD_RESET_KEY = `password_reset`,
  LOGIN_ATTEMPT_LOCK = `login_attempt_lock`,
  MFA_VERIFICATION_KEY = `mfa_verification`,
  EMAIL_CHANGE = `request_email_update`,
  CONTINUE_REGISTRATION = 'continue_registration',
  preQualify_VERIFICATION = `Prequalify`,
  ACCEPT_INVITE_KEY = 'ACCEPT_INVITE_KEY',
  PASSWORD_CHANGE_MFA = 'password_change_mfa',
  PASSWORD_CHANGE_MFA_TOTP = 'password_change_mfa_totp',
  RESET_PASSWORD = 'reset_password',
}
