// HSF-Backend-New/src/application/useCases/ManageOrganizations.ts
import { Organization } from '@domain/entities/Organization'
import { UserOrganizationMember } from '@domain/entities/UserOrganizationMember'
import { OrganizationType } from '@domain/enums/organizationEnum'
import {
  DEVELOPER_COMPANY_ROLES,
  HSF_INTERNAL_ROLES,
  LENDER_INSTITUTION_ROLES,
  Role,
} from '@domain/enums/rolesEmun'
import { IOrganizationRepository } from '@domain/interfaces/IOrganizationRepository'
import { User } from '@entities/User' // Import User
import { IUserRepository } from '@interfaces/IUserRepository'
import {
  SeekPaginationOption,
  SeekPaginationResult,
} from '@shared/types/paginate' // Import pagination types

export class ManageOrganizations {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly userRepository: IUserRepository,
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

  async getCurrentOrgRoles(organizationType: OrganizationType) {
    let types: Array<Role> = []
    switch (organizationType) {
      case OrganizationType.HSF_INTERNAL:
        types = HSF_INTERNAL_ROLES
        break

      case OrganizationType.DEVELOPER_COMPANY:
        types = DEVELOPER_COMPANY_ROLES
        break

      case OrganizationType.LENDER_INSTITUTION:
        types = LENDER_INSTITUTION_ROLES

      default:
        return null
    }
    return this.userRepository.getRolesByType(types)
  }

  async getRoles() {
    return this.userRepository.getRoles()
  }
}

/*

let types: Array<Role> = []
switch (organizationType) {
  case OrganizationType.HSF_INTERNAL:
    types = HSF_INTERNAL_ROLES
    break

  case OrganizationType.DEVELOPER_COMPANY:
    types = DEVELOPER_COMPANY_ROLES
    break

  case OrganizationType.LENDER_INSTITUTION:
    types = LENDER_INSTITUTION_ROLES

  default:
    return null
}*/
