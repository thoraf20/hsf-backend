// HSF-Backend-New/src/domain/interfaces/IOrganizationRepository.ts
import { Organization } from '@domain/entities/Organization'
import { UserOrganizationMember } from '@domain/entities/UserOrganizationMember'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { User } from '@entities/User'
import { SeekPaginationResult } from '@shared/types/paginate'
import { OrgMembersFilters } from '@validators/organizationValidator'

export interface IOrganizationRepository {
  createOrganization(organization: Organization): Promise<Organization>
  getOrganizationById(id: string): Promise<Organization | null>
  getHsfOrganization(): Promise<Organization>
  updateOrganization(
    id: string,
    organization: Partial<Organization>,
  ): Promise<Organization | null>
  deleteOrganization(id: string): Promise<void>

  getOrganizationsByType(type: OrganizationType): Promise<Organization[]>

  addUserToOrganization(
    userOrganizationMember: UserOrganizationMember,
  ): Promise<UserOrganizationMember>
  removeUserFromOrganization(
    userId: string,
    organizationId: string,
  ): Promise<void>

  getOrganizationMembers(
    organizationId: string,
    filter: OrgMembersFilters,
  ): Promise<
    SeekPaginationResult<
      UserOrganizationMember & {
        user: User
        role: { id: string; name: string }
      }
    >
  >

  getOrgenizationMemberByUserId(userId: string): Promise<
    UserOrganizationMember & {
      organization: Organization
      role: { id: string; name: string }
    }
  >

  getOrganizationMemberByMemberID(
    memberId: string,
    organizationId: string,
  ): Promise<
    UserOrganizationMember & {
      organization: Organization
      role: { id: string; name: string }
    }
  >

  // New method to check if a user is a member of a specific organization
  isUserMemberOfOrganization(
    userId: string,
    organizationId: string,
  ): Promise<boolean>
}
