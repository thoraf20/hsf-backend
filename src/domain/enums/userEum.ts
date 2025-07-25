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

export enum MfaPurpose {
  ChangePassword = 'Change Password',
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

export enum MartialStatus {
  SINGLE = 'Single',
  MARRIED = 'Married',
  DIVORCED = 'Divorced',
  WIDOWED = 'Widowed',
}

export enum AssignableType {
  LOAN = 'Loan',
}

export enum UserAssignmentRole {
  LOAN_OFFICER = 'LoanOfficer',
  REVIEWER = 'Reviewer',
  APPROVER = 'Approver',
  MANAGER = 'Manager',
  COLLABORATOR = 'Collaborator',
  OWNER = 'Owner',
  ASSIGNEE = 'Assignee', // A general term if the specific role isn't important
}
