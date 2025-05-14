// HSF-Backend-New/src/presentation/controllers/OrganizationController.ts
import { ManageOrganizations } from '@application/useCases/ManageOrganizations'
import { OrganizationRepository } from '@infrastructure/repositories/OrganizationRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import { createResponse } from '@presentation/response/responseType'
import { UpdateOrganizationInput } from '@validators/organizationValidator'
import { SeekPaginationOption } from '@shared/types/paginate' // Import pagination types

export class OrganizationController {
  private manageOrganizations: ManageOrganizations

  constructor() {
    this.manageOrganizations = new ManageOrganizations(
      new OrganizationRepository(),
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
}
