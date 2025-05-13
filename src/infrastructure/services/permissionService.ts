import { Knex } from 'knex'
import { User } from '@domain/entities/User' // Your User entity
import db from '@infrastructure/database/knex'
import { Permission } from '@domain/enums/permissionEnum'

export class PermissionService {
  private db: Knex

  constructor() {
    this.db = db // Or however you access your Knex instance
  }

  /**
   * Fetches all distinct permission names for a given user.
   * This includes permissions from their global role (on users table)
   * and all roles they have in any organization they are a member of.
   * @param userId The ID of the user.
   * @param organizationId Optional: If provided, only include permissions relevant to this specific organization context.
   * @returns A Promise resolving to a Set of permission names (strings).
   */
  public async getUserPermissions(
    userId: string,
    organizationId?: string,
  ): Promise<Set<Permission>> {
    const userPermissions = new Set<Permission>()

    // 1. Get user's global role_id (if your users table has one)
    const userRecord = await this.db<User>('users')
      .where({ id: userId })
      .select('role_id')
      .first()

    const roleIdsToQuery: string[] = []

    if (userRecord && userRecord.role_id) {
      roleIdsToQuery.push(userRecord.role_id)
    }

    // 2. Get user's roles from organizations
    let organizationRolesQuery = this.db('user_organization_memberships')
      .where({ user_id: userId })
      .select('role_id')

    if (organizationId) {
      // If checking for a specific organization context, only get roles from that org
      organizationRolesQuery = organizationRolesQuery.andWhere({
        organization_id: organizationId,
      })
    }

    const orgRoles = await organizationRolesQuery
    orgRoles.forEach((or) => roleIdsToQuery.push(or.role_id))

    if (roleIdsToQuery.length === 0) {
      return userPermissions // No roles, so no permissions
    }

    // 3. Get all permissions associated with these roles
    const distinctRoleIds = [...new Set(roleIdsToQuery)] // Ensure unique role IDs

    const permissionsFromDb = await this.db('role_permissions')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .whereIn('role_permissions.role_id', distinctRoleIds)
      .select('permissions.name as permission_name')

    permissionsFromDb.forEach((p) =>
      userPermissions.add(p.permission_name as Permission),
    )

    return userPermissions
  }

  /**
   * Checks if a user has all the required permissions.
   * @param userId The user's ID.
   * @param requiredPermissions An array of permission names.
   * @param organizationId Optional: The context organization ID for the permission check.
   * @returns True if the user has ALL required permissions, false otherwise.
   */
  public async hasAllPermissions(
    userId: string,
    requiredPermissions: Permission[],
    organizationId?: string,
  ): Promise<boolean> {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true // No permissions required, so access is granted
    }
    const userPermissions = await this.getUserPermissions(
      userId,
      organizationId,
    )
    return requiredPermissions.every((rp) => userPermissions.has(rp))
  }

  /**
   * Checks if a user has at least one of the required permissions.
   * @param userId The user's ID.
   * @param requiredPermissions An array of permission names.
   * @param organizationId Optional: The context organization ID for the permission check.
   * @returns True if the user has AT LEAST ONE of the required permissions, false otherwise.
   */
  public async hasAnyPermission(
    userId: string,
    requiredPermissions: Permission[],
    organizationId?: string,
  ): Promise<boolean> {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true // No permissions required
    }
    const userPermissions = await this.getUserPermissions(
      userId,
      organizationId,
    )
    return requiredPermissions.some((rp) => userPermissions.has(rp))
  }
}
