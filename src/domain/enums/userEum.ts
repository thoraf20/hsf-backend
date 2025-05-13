export enum UserStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Pending = 'Pending',
  Suspended = 'Suspended',
  Banned = 'Banned',
  Deleted = 'Deleted',
}

export enum MfaFlow {
  EMAIL_OTP = 'email_otp',
  TOTP = 'totp',
  RecoveryCode = 'recovery_code',
}
