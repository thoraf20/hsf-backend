export enum UserStatus {
  Active,
  Inactive,
  Pending,
  Suspended,
  Banned,
  Deleted,
}

export enum MfaFlow {
  EMAIL_OTP = 'email_otp',
  TOTP = 'totp',
  RecoveryCode = 'recovery_code',
}
