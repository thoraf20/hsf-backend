export enum OrganizationType {
  /**
   * Represents the HSF Finance platform itself and its internal operations.
   */
  HSF_INTERNAL = 'HSF_INTERNAL',

  /**
   * Represents a Property Developer Company registered on the platform.
   * These organizations will list properties and manage their agents.
   */
  DEVELOPER_COMPANY = 'DEVELOPER_COMPANY',

  /**
   * Represents a Lending Institution (e.g., a bank or mortgage company)
   * that provides loan services through the platform.
   */
  LENDER_INSTITUTION = 'LENDER_INSTITUTION',

  /**
   * Represents a Trustee firm or individual involved in transactions.
   */
  TRUSTEE_FIRM = 'TRUSTEE_FIRM', // Example new type

  /**
   * Represents a partner bank that might not be a full Lender Institution
   * but has some integration or role.
   */
  PARTNER_BANK = 'PARTNER_BANK', // Example new type
}

export enum HsfRole {}

export enum OrganizationStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  PENDING_APPROVAL = 'Pending Approval',
  SUSPENDED = 'Suspended',
  DELETED = 'Deleted',
}

export enum OrganizationMemberStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  SUSPENDED = 'Suspended',
  INVITED = 'Invited',
  DECLINED = 'Declined',
}
