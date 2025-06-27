// HSF-Backend-New/src/infrastructure/repositories/OrganizationRepository.ts
import { Organization } from '@domain/entities/Organization'
import { UserOrganizationMember } from '@domain/entities/UserOrganizationMember'
import { IOrganizationRepository } from '@domain/interfaces/IOrganizationRepository'
import db, { createUnion } from '@infrastructure/database/knex'
import { User } from '@entities/User'
import { SeekPaginationResult } from '@shared/types/paginate'
import { exculedPasswordUserInfo } from '@shared/respositoryValues'
import { OrganizationType } from '@domain/enums/organizationEnum'

import { Knex } from 'knex'
import { SearchType } from '@shared/types/repoTypes'
import { applyPagination } from '@shared/utils/paginate'
import { OrgMembersFilters } from '@validators/organizationValidator'

export class OrganizationRepository implements IOrganizationRepository {
  async createOrganization(organization: Organization): Promise<Organization> {
    // Check if an HSF_INTERNAL organization already exists before creating a new one
    if (organization.type === OrganizationType.HSF_INTERNAL) {
      const existingHsfOrgs = await this.getOrganizationsByType(
        OrganizationType.HSF_INTERNAL,
      )
      if (existingHsfOrgs.length > 0) {
        throw new Error('An organization of type HSF_INTERNAL already exists.')
      }
    }

    const [newOrganization] = await db('organizations')
      .insert(organization)
      .returning('*')
    return new Organization(newOrganization)
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    const organization = await db('organizations').where({ id }).first()
    return organization ?? null
  }

  async getHsfOrganization(): Promise<Organization> {
    return (await this.getOrganizationsByType(OrganizationType.HSF_INTERNAL))[0]
  }

  async updateOrganization(
    id: string,
    organization: Partial<Organization>,
  ): Promise<Organization | null> {
    const [updatedOrganization] = await db('organizations')
      .where({ id })
      .update(organization)
      .returning('*')
    return updatedOrganization ? new Organization(updatedOrganization) : null
  }

  async deleteOrganization(id: string): Promise<void> {
    await db('organizations').where({ id }).delete()
  }

  async addUserToOrganization(
    userOrganizationMember: UserOrganizationMember,
  ): Promise<UserOrganizationMember> {
    const [newMember] = await db('user_organization_memberships')
      .insert(userOrganizationMember)
      .returning('*')
    return new UserOrganizationMember(newMember)
  }

  async removeUserFromOrganization(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    await db('user_organization_memberships')
      .where({ user_id: userId, organization_id: organizationId })
      .delete()
  }

  useOrgMemberFilter(
    q: Knex.QueryBuilder<any, any[]>,
    filters: OrgMembersFilters,
  ) {
    const add = createUnion(SearchType.EXCLUSIVE)

    if (filters.status) {
      q = add(q).whereRaw(`uom.status = '${filters.status}'`)
    }

    if (filters.role_id) {
      q = add(q).whereRaw(`r.id = '${filters.role_id}'`)
    }

    return q
  }

  async getOrganizationMembers(
    organizationId: string,
    filters: OrgMembersFilters,
  ): Promise<
    SeekPaginationResult<
      UserOrganizationMember & {
        user: User
        role: { id: string; name: string }
      }
    >
  > {
    let query = db('user_organization_memberships as uom')
      .where('uom.organization_id', organizationId)
      .join('users as u', 'uom.user_id', 'u.id')
      .join('roles as r', 'uom.role_id', 'r.id')
      .select(
        'uom.*',
        db.raw(`json_strip_nulls(json_build_object(
            ${exculedPasswordUserInfo.map((field) => `'${field.replace('u.', '')}', ${field}`).join(',\n            ')}
           )) as user`),
        'r.name as role',
      )
      .groupBy('uom.id', 'r.id', 'u.id')

    query = this.useOrgMemberFilter(query, filters).orderBy(
      'uom.created_at',
      'asc',
    )

    return applyPagination(query, filters)
  }

  async getOrgenizationMemberByUserId(userId: string): Promise<
    UserOrganizationMember & {
      organization: Organization
      role: { id: string; name: string }
    }
  > {
    return db('user_organization_memberships as uom')
      .where('uom.user_id', userId)
      .join('organizations as o', 'uom.organization_id', 'o.id')
      .join('roles as r', 'uom.role_id', 'r.id')
      .select(
        'uom.*',
        db.raw(`row_to_json(o) as organization`),
        db.raw(`row_to_json(r) as role`),
      )
      .groupBy('uom.id', 'o.*', 'r.*')
      .first()
  }

  async getOrganizationMemberByMemberID(
    memberId: string,
    organizationId: string,
  ): Promise<
    UserOrganizationMember & {
      organization: Organization
      role: { id: string; name: string }
    }
  > {
    return db('user_organization_memberships as uom')
      .where('uom.id', memberId)
      .andWhere('o.id', organizationId)
      .join('organizations as o', 'uom.organization_id', 'o.id')
      .join('roles as r', 'uom.role_id', 'r.id')
      .select(
        'uom.*',
        db.raw(`row_to_json(o) as organization`),
        db.raw(`row_to_json(r) as role`),
      )
      .groupBy('uom.id', 'o.*', 'r.*')
      .first()
  }

  // New method implementation
  async isUserMemberOfOrganization(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    const membership = await db('user_organization_memberships')
      .where({ user_id: userId, organization_id: organizationId })
      .first()

    return !!membership
  }

  async getOrganizationsByType(
    type: OrganizationType,
  ): Promise<Organization[]> {
    return db<Organization>('organizations').select().where({ type })
  }
}
