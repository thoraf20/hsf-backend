// HSF-Backend-New/src/presentation/controllers/OrganizationController.ts
import { ManageOrganizations } from '@application/useCases/ManageOrganizations'
import { OrganizationRepository } from '@infrastructure/repositories/OrganizationRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import { createResponse } from '@presentation/response/responseType'
import {
  OrgMemberRoleFilters,
  UpdateOrganizationInput,
} from '@validators/organizationValidator'
import { AuthInfo } from '@shared/utils/permission-policy'
import { UserRepository } from '@repositories/user/UserRepository'
import { QueryBoolean } from '@shared/utils/helpers'
import { ADMIN_LEVEL_ROLES, Role, RoleSelect } from '@domain/enums/rolesEmun'

export class OrganizationController {
  private manageOrganizations: ManageOrganizations

  constructor() {
    this.manageOrganizations = new ManageOrganizations(
      new OrganizationRepository(),
      new UserRepository(),
    )
  }

  async getOrganizationById(id: string) {
    const organization = await this.manageOrganizations.getOrganizationById(id)
    if (!organization) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Organization not found',
      )
    }

    return createResponse(
      StatusCodes.OK,
      'Organization retrieved successfully',
      { organization },
    )
  }

  async updateOrganization(id: string, input: UpdateOrganizationInput) {
    const organization = await this.manageOrganizations.updateOrganization(
      id,
      input,
    )

    if (!organization) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Organization not found',
      )
    }

    return createResponse(
      StatusCodes.OK,
      'Organization updated successfully', // Changed message to reflect update
      { organization },
    )
  }

  async deleteOrganization(id: string) {
    await this.manageOrganizations.deleteOrganization(id)

    return createResponse(
      StatusCodes.OK,
      'Organization deleted successfully', // Changed message to reflect deletion
      { id },
    )
  }

  // Modified to accept pagination and use asyncMiddleware
  async getOrganizationMembers(organizationId: string, query: any) {
    const members = await this.manageOrganizations.getOrganizationMembers(
      organizationId,
      query,
    )

    return createResponse(
      StatusCodes.OK,
      'Organization members retrieved successfully',
      members,
    )
  }

  // New method to get organizations for a specific user
  async getOrganizationsForUser(userId: string) {
    const organizations =
      await this.manageOrganizations.getOrganizationsForUser(userId)

    return createResponse(
      StatusCodes.OK,
      "User's organizations retrieved successfully",
      organizations,
    )
  }

  async getCurrentOrgRoles(authInfo: AuthInfo, query: OrgMemberRoleFilters) {
    let roles = await this.manageOrganizations.getCurrentOrgRoles(
      authInfo.organizationType,
    )

    if (!roles) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        `Roles  for organization '${authInfo.organizationType}' not found`,
      )
    }

    roles = roles.filter((role) =>
      query.select === RoleSelect.SubAdmin
        ? !ADMIN_LEVEL_ROLES.includes(role.name as Role)
        : query.select === RoleSelect.Admin
          ? ADMIN_LEVEL_ROLES.includes(role.name as Role)
          : true,
    )

    return createResponse(
      StatusCodes.OK,
      "User's organization available roles retrieved successfully",
      { roles },
    )
  }

  async getRoles(authInfo: AuthInfo) {
    const roles = await this.manageOrganizations.getCurrentOrgRoles(
      authInfo.organizationType,
    )

    if (!roles) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        `Roles  for organization '${authInfo.organizationType}' not found`,
      )
    }

    return createResponse(
      StatusCodes.OK,
      "User's organization available roles retrieved successfully",
      { roles },
    )
  }
}
