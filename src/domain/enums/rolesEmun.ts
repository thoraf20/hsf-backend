export enum Role {
  SUPER_ADMIN = 'super_admin',
  HOME_BUYER = 'home_buyer',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  TRUSTEE = 'trustee',
  BANK = 'bank',
  LENDER = 'lender',
  LOAN_OFFICER = 'loan officer',
  COMPLIANCE_OFFICER = 'compliance officer',
  INSPECTION_MANAGER = 'inspection manager',
  DISPUTE_MANAGER = 'dispute manager',
  CUSTOMER_SUPPORT = 'customer support',
}

export enum DefaulPasswordAccess {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  TRUSTEE = 'trustee',
  BANK = 'bank',
  LOAN_OFFICER = 'loan officer',
  COMPLIANCE_OFFICER = 'compliance officer',
  INSPECTION_MANAGER = 'inspection manager',
  DISPUTE_MANAGER = 'dispute manager',
  CUSTOMER_SUPPORT = 'customer support',
  LENDER = 'lender',
}

export enum adminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
}

export enum subAdminRole {
  LOAN_OFFICER = 'loan officer',
  COMPLIANCE_OFFICER = 'compliance officer',
  INSPECTION_MANAGER = 'inspection manager',
  DISPUTE_MANAGER = 'dispute manager',
  CUSTOMER_SUPPORT = 'customer support',
}
//under admin three  users roles loan officer, supervisor and management , all the documents are sent to lending bank, notify  admin and home buyer
