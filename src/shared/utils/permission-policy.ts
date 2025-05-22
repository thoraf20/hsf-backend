import { OrganizationType } from '@domain/enums/organizationEnum'
import { Role } from '@domain/enums/rolesEmun'
import { UserRolePermission } from '@entities/User'

/**
 * Represents a user's membership in a specific organization,
 * including their role within that organization.
 */
export interface OrganizationMembership {
  organizationId: string
  permissions?: Array<UserRolePermission>
  organizationRole: Role // The role the user has within this specific organization
}

/**
 * Represents comprehensive authentication and authorization information for a user
 * during a request.
 * A user can belong to at most one organization.
 */
export interface AuthInfo {
  userId: string
  roleId: string
  globalRole?: Role // The user\'s primary global role (from the \'users\' table)
  organizationMembership?: OrganizationMembership // The single organization the user is a member of, if any
  currentOrganizationId?: string // The organization ID relevant to the current request, if any
  organizationType?: OrganizationType
}

const ROLE_LEVELS: Partial<Record<Role, number>> = {
  [Role.SUPER_ADMIN]: 3, // Highest level, can manage all lower-level admins
  [Role.HSF_ADMIN]: 2, // Can manage organization admins and potentially other HSF staff
  [Role.DEVELOPER_ADMIN]: 1, // Organization admin, level 1
  [Role.LENDER_ADMIN]: 1, // Organization admin, level 1
  [Role.HSF_LOAN_OFFICER]: 0, // HSF internal staff level 0
  [Role.HSF_COMPLIANCE_OFFICER]: 0, // HSF internal staff level 0
  [Role.HSF_INSPECTION_MANAGER]: 0, // HSF internal staff level 0
  [Role.HSF_DISPUTE_MANAGER]: 0, // HSF internal staff level 0
  [Role.HSF_CUSTOMER_SUPPORT]: 0, // HSF internal staff level 0
}

export function getRoleLevel(role: Role): number {
  return ROLE_LEVELS[role] ?? 0
}

/**
 * Defines the signature for a function that checks a specific permission
 * based on the provided AuthInfo.
 */
export type PermissionCheck = (authInfo: AuthInfo) => boolean

/**
 * Creates a permission check that verifies if the user has any of the specified
 * roles within the context of the current organization for the request.
 * Requires that `authInfo.currentOrganizationId` is set and matches the user\'s single organization membership.
 */
export const requireOrganizationRole = (
  allowedRoles: Role | Role[],
): PermissionCheck => {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  return (authInfo: AuthInfo) => {
    // Must have a current organization context AND the user must be a member of an organization
    if (!authInfo.currentOrganizationId || !authInfo.organizationMembership) {
      return false
    }

    // The current organization context must match the user's single organization membership
    if (
      authInfo.organizationMembership.organizationId !==
      authInfo.currentOrganizationId
    ) {
      return false
    }

    // Check if the user\'s role within their organization is in the allowed roles
    return rolesArray.includes(authInfo.organizationMembership.organizationRole)
  }
}

/**
 * Combines multiple permission checks. Returns true if ANY of the checks pass.
 */
export const RequireAny = (...checks: PermissionCheck[]): PermissionCheck => {
  return (authInfo: AuthInfo) => {
    for (const check of checks) {
      if (check(authInfo)) {
        return true
      }
    }
    return false
  }
}

/**
 * Combines multiple permission checks. Returns true if ALL of the checks pass.
 */
export const All = (...checks: PermissionCheck[]): PermissionCheck => {
  return (authInfo: AuthInfo) => {
    for (const check of checks) {
      if (!check(authInfo)) {
        return false
      }
    }
    return true
  }
}

export function isOrganizationUser(authInfo: AuthInfo) {
  return !!authInfo.currentOrganizationId
}

export function isHomeBuyer(authInfo: AuthInfo) {
  return authInfo.globalRole === Role.HOME_BUYER
}

export function requireOrganizationType(...types: Array<OrganizationType>) {
  return (authInfo: AuthInfo) => {
    return (
      isOrganizationUser(authInfo) &&
      types.some((type) => authInfo.organizationType === type)
    )
  }
}

export const requireRoleLevel = (minimumLevel: number): PermissionCheck => {
  return (authInfo: AuthInfo) => {
    const userLevel = getRoleLevel(authInfo.globalRole!)
    return userLevel >= minimumLevel
  }
}

export function isHigherRoleLevel(
  requesterRole: Role,
  targetRole: Role,
): boolean {
  return getRoleLevel(requesterRole) > getRoleLevel(targetRole)
}
