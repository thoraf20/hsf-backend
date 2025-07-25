// HSF-Backend-New/src/presentation/controllers/OrganizationController.ts
import { ManageOrganizations } from '@application/useCases/ManageOrganizations'
import { OrganizationRepository } from '@infrastructure/repositories/OrganizationRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import { createResponse } from '@presentation/response/responseType'
import {
  CreateEmployeeInput,
  CreateHSFAdminInput,
  CreateLenderInput,
  Disable2faOrgMemberInput,
  LenderFilters,
  OrgMemberRoleFilters,
  OrgMembersFilters,
  ResetOrgOwnerPasswordInput,
  SuspendOrgInput,
  UpdateOrganizationInput,
} from '@validators/organizationValidator'
import { AuthInfo } from '@shared/utils/permission-policy'
import { UserRepository } from '@repositories/user/UserRepository'
import { ADMIN_LEVEL_ROLES, Role, RoleSelect } from '@domain/enums/rolesEnum'
import { LenderRepository } from '@repositories/Agents/LenderRepository'
import { AddressRepository } from '@repositories/user/AddressRepository'
import { UserFilters } from '@validators/userValidator'
import { DeveloperRepository } from '@repositories/Agents/DeveloperRepository'
import { PropertyRepository } from '@repositories/property/PropertyRepository'
import {
  CreateDeveloperInput,
  DeveloperFilters,
} from '@validators/developerValidator'
import { DocumentRepository } from '@repositories/property/DocumentRepository'
import { UserActivityLogRepository } from '@repositories/UserActivityLogRepository'
import { ContactInformationRepository } from '@repositories/user/ContactInformationRepository'

export class OrganizationController {
  private manageOrganizations: ManageOrganizations

  constructor() {
    this.manageOrganizations = new ManageOrganizations(
      new OrganizationRepository(),
      new UserRepository(),
      new LenderRepository(),
      new AddressRepository(),
      new DeveloperRepository(),
      new PropertyRepository(),
      new DocumentRepository(),
      new UserActivityLogRepository(),
      new ContactInformationRepository(),
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
  async getOrganizationMembers(
    organizationId: string,
    query: OrgMembersFilters,
    authInfo: AuthInfo,
  ) {
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

  async getOrgMemberById(
    organizationId: string,
    memberId: string,
    authInfo: AuthInfo,
  ) {
    const members = await this.manageOrganizations.getOrgMemberById(
      organizationId,
      memberId,
      authInfo,
    )

    return createResponse(
      StatusCodes.OK,
      'Organization member retrieved successfully',
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

  async getOrgRoles(organizationId: string, query: OrgMemberRoleFilters) {
    const organization =
      await this.manageOrganizations.getOrganizationById(organizationId)

    console.log({ organization })

    let roles = await this.manageOrganizations.getCurrentOrgRoles(
      organization.type,
    )

    if (!roles) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        `Roles  for organization '${organization.type}' not found`,
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

  async getLenders(filters: LenderFilters) {
    const lenderContents = await this.manageOrganizations.getLenders(filters)
    return createResponse(
      StatusCodes.OK,
      'Lenders retrieved successfully',
      lenderContents,
    )
  }

  async getLenderByID(lenderId: string) {
    const lenderContents =
      await this.manageOrganizations.getLenderById(lenderId)
    return createResponse(
      StatusCodes.OK,
      'Lender retrieved successfully',
      lenderContents,
    )
  }

  async getSubAdmins(filters: UserFilters) {
    const subAdminContents = await this.manageOrganizations.getAdmins(
      filters,
      'sub-admin',
    )
    return createResponse(
      StatusCodes.OK,
      'Sub admin retrieved successfully',
      subAdminContents,
    )
  }

  async getAdmin(filters: UserFilters) {
    const adminContents = await this.manageOrganizations.getAdmins(
      filters,
      'admin',
    )
    return createResponse(
      StatusCodes.OK,
      'Admins retrieved successfully',
      adminContents,
    )
  }

  async createLender(data: CreateLenderInput) {
    const lender = await this.manageOrganizations.createLender(data)
    return createResponse(StatusCodes.CREATED, 'Lender created', { lender })
  }

  async createHsfSubAdmin(auth: AuthInfo, data: CreateHSFAdminInput) {
    const subAdmin = await this.manageOrganizations.createHSFSubAdmin(
      auth,
      data,
    )

    return createResponse(
      StatusCodes.CREATED,
      'Sub admin created successfully',
      { sub_admin: subAdmin },
    )
  }

  async createHsfAdmin(auth: AuthInfo, data: CreateHSFAdminInput) {
    const admin = await this.manageOrganizations.createHSFAdmin(auth, data)

    return createResponse(StatusCodes.CREATED, 'Admin created successfully', {
      admin: admin,
    })
  }

  async getDevelopers(filters: DeveloperFilters) {
    const developerContents =
      await this.manageOrganizations.getDevelopers(filters)

    return createResponse(
      StatusCodes.OK,
      'Developers retrived successfully',
      developerContents,
    )
  }

  async getDeveloperByDeveloperId(developerId: string) {
    const developer =
      await this.manageOrganizations.getDeveloperByDeveloperID(developerId)

    if (!developer) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Developer not found',
      )
    }

    return createResponse(
      StatusCodes.OK,
      'Developer retrived successfully',
      developer,
    )
  }

  async createDeveloper(data: CreateDeveloperInput) {
    const newDeveloper = await this.manageOrganizations.createDeveloper(data)
    return createResponse(
      StatusCodes.CREATED,
      'Developer onboarded successfully',
      { developer: newDeveloper },
    )
  }

  async getDeveloperRegRequiredDoc() {
    const developerRegDocs =
      await this.manageOrganizations.getDeveloperRegRequiredDoc()

    return createResponse(
      StatusCodes.OK,
      'Developer registration documents',
      developerRegDocs,
    )
  }

  async resetOrgMemberPassword(authInfo: AuthInfo, memberId: string) {
    const newLoginCred = await this.manageOrganizations.resetOrgMemberPassword(
      authInfo,
      memberId,
    )

    return createResponse(
      StatusCodes.OK,
      'Password reset successfully.',
      newLoginCred,
    )
  }

  async hsfResetOrgMemberPassword(
    authInfo: AuthInfo,
    input: ResetOrgOwnerPasswordInput,
  ) {
    const newLoginCred =
      await this.manageOrganizations.hsfResetOrgMemberPassword(authInfo, input)

    return createResponse(
      StatusCodes.OK,
      'Password reset successfully.',
      newLoginCred,
    )
  }

  async disableOrgMember2fa(
    authInfo: AuthInfo,
    input: Disable2faOrgMemberInput,
  ) {
    const disabled2faUser = await this.manageOrganizations.disableOrgMember2fa(
      authInfo,
      input.member_id,
    )

    return createResponse(
      StatusCodes.OK,
      'Authenicator mfa disabled successfully.',
      disabled2faUser,
    )
  }

  async suspendOrganization(id: string, input: SuspendOrgInput) {
    const organization = await this.manageOrganizations.suspendOrganization(
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
      'Organization suspended successfully',
      { organization },
    )
  }

  async activateOrganization(id: string) {
    const organization = await this.manageOrganizations.activateOrganization(id)

    return createResponse(
      StatusCodes.OK,
      'Organization activated successfully',
      { organization },
    )
  }

  async createEmployee(authInfo: AuthInfo, input: CreateEmployeeInput) {
    const newEmployee = await this.manageOrganizations.createEmployee(
      authInfo,
      input,
    )

    return createResponse(
      StatusCodes.CREATED,
      'Employee created successfully',
      newEmployee,
    )
  }
}
