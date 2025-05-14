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

export enum AddressType {
  Home = 'Home',
  Work = 'Work',
  Billing = 'Billing',
  Shipping = 'Shipping',
  Other = 'Other',
}
