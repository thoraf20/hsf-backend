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

export enum Role {
  // --- HSF Internal Roles ---
  /**
   * Has all permissions across the entire platform.
   * Manages HSF settings, users, and organizations.
   */
  SUPER_ADMIN = 'Super Admin',

  /**
   * General administrative role within HSF.
   * Permissions might be a subset of SUPER_ADMIN, focused on day-to-day operations.
   */
  HSF_ADMIN = 'Admin',

  /**
   * HSF staff responsible for processing and managing loan applications.
   */
  HSF_LOAN_OFFICER = 'Loan Officer',

  /**
   * HSF staff ensuring adherence to regulations and policies.
   */
  HSF_COMPLIANCE_OFFICER = 'Compliance Officer',

  /**
   * HSF staff managing property inspections and related processes.
   */
  HSF_INSPECTION_MANAGER = 'Inspection Manager',

  /**
   * HSF staff handling disputes and resolutions.
   */
  HSF_DISPUTE_MANAGER = 'Dispute Manager',

  /**
   * HSF staff providing support to users of the platform.
   */
  HSF_CUSTOMER_SUPPORT = 'Customer Support',

  // --- Developer Company Roles ---
  /**
   * Primary administrator for a Developer Company's organization.
   * Manages their company profile, agents, and property listings.
   */
  DEVELOPER_ADMIN = 'Developer Admin',

  /**
   * Agent working under a Developer Company.
   * Manages property listings assigned to them.
   */
  DEVELOPER_AGENT = 'Developer Agent',

  // --- Lender Institution Roles ---
  /**
   * Primary administrator for a Lender Institution's organization.
   * Manages their institution profile, staff, and loan products.
   */
  LENDER_ADMIN = 'Lender Admin',

  /**
   * Loan officer working within a Lender Institution.
   * Processes loan applications submitted through HSF.
   */
  LENDER_LOAN_OFFICER = 'Lender Loan Officer',

  /**
   * Underwriter working within a Lender Institution.
   * Assesses risk and makes decisions on loan applications.
   */
  LENDER_UNDERWRITER = 'Lender Underwriter',

  // --- Other Key Player Roles ---
  /**
   * Individual looking to buy a home through the platform.
   */
  HOME_BUYER = 'Home Buyer',

  /**
   * Neutral third-party holding funds/documents during a transaction.
   * This role might interact with specific escrow features.
   */
  TRUSTEE = 'Trustee',
}

// --- Role Groupings for easier checks ---

/**
 * Roles primarily associated with HSF's internal operations and platform administration.
 */
export const HSF_INTERNAL_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.HSF_ADMIN,
  Role.HSF_LOAN_OFFICER,
  Role.HSF_COMPLIANCE_OFFICER,
  Role.HSF_INSPECTION_MANAGER,
  Role.HSF_DISPUTE_MANAGER,
  Role.HSF_CUSTOMER_SUPPORT,
]

/**
 * Roles associated with a Developer Company organization.
 */
export const DEVELOPER_COMPANY_ROLES: Role[] = [
  Role.DEVELOPER_ADMIN,
  Role.DEVELOPER_AGENT,
]

/**
 * Roles associated with a Lender Institution organization.
 */
export const LENDER_INSTITUTION_ROLES: Role[] = [
  Role.LENDER_ADMIN,
  Role.LENDER_LOAN_OFFICER,
  Role.LENDER_UNDERWRITER,
]

/**
 * Roles that are considered administrators of some kind (platform or organization).
 */
export const ADMIN_LEVEL_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.HSF_ADMIN,
  Role.DEVELOPER_ADMIN,
  Role.LENDER_ADMIN,
]

/**
 * Helper function to check if a role is an HSF internal role.
 * @param role The role to check.
 * @returns True if the role is an HSF internal role, false otherwise.
 */
export function isHsfInternalRole(role: Role): boolean {
  return HSF_INTERNAL_ROLES.includes(role)
}

/**
 * Helper function to check if a role belongs to a Developer Company.
 * @param role The role to check.
 * @returns True if the role is a Developer Company role, false otherwise.
 */
export function isDeveloperCompanyRole(role: Role): boolean {
  return DEVELOPER_COMPANY_ROLES.includes(role)
}

/**
 * Helper function to check if a role belongs to a Lender Institution.
 * @param role The role to check.
 * @returns True if the role is a Lender Institution role, false otherwise.
 */
export function isLenderInstitutionRole(role: Role): boolean {
  return LENDER_INSTITUTION_ROLES.includes(role)
}

export enum RoleSelect {
  All = 'All',
  SubAdmin = 'Sub Admin',
  Admin = 'Admin',
}
