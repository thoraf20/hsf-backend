// HSF-Backend-New/src/application/useCases/ManageOrganizations.ts
import { Organization } from '@domain/entities/Organization'
import { UserOrganizationMember } from '@domain/entities/UserOrganizationMember'
import { IOrganizationRepository } from '@domain/interfaces/IOrganizationRepository'
import { User } from '@entities/User' // Import User
import {
  SeekPaginationOption,
  SeekPaginationResult,
} from '@shared/types/paginate' // Import pagination types

export class ManageOrganizations {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async createOrganization(organization: Organization): Promise<Organization> {
    return this.organizationRepository.createOrganization(organization)
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    return this.organizationRepository.getOrganizationById(id)
  }

  async updateOrganization(
    id: string,
    organization: Partial<Organization>,
  ): Promise<Organization | null> {
    return this.organizationRepository.updateOrganization(id, organization)
  }

  async deleteOrganization(id: string): Promise<void> {
    return this.organizationRepository.deleteOrganization(id)
  }

  async addUserToOrganization(
    userOrganizationMember: UserOrganizationMember,
  ): Promise<UserOrganizationMember> {
    return this.organizationRepository.addUserToOrganization(
      userOrganizationMember,
    )
  }

  async removeUserFromOrganization(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    return this.organizationRepository.removeUserFromOrganization(
      userId,
      organizationId,
    )
  }

  async getOrganizationMembers(
    organizationId: string,
    paginateOption?: SeekPaginationOption, // Accept pagination option
  ): Promise<
    SeekPaginationResult<
      UserOrganizationMember & { user: User; role: { name: string } }[]
    >
  > {
    // Update return type
    return this.organizationRepository.getOrganizationMembers(
      organizationId,
      paginateOption,
    ) // Pass pagination option
  }

  async getOrganizationsForUser(userId: string) {
    return this.organizationRepository.getOrganizationsByUserId(userId)
  }
}
