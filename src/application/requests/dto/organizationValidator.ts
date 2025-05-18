import { z } from 'zod'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { QueryBoolean } from '@shared/utils/helpers'
import { RoleSelect } from '@domain/enums/rolesEmun'

export const createOrganizationSchema = z.object({
  name: z.string().min(3).max(255),
  type: z.nativeEnum(OrganizationType),
  owner_user_id: z.string().uuid().optional(),
})

export const updateOrganizationSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  type: z.nativeEnum(OrganizationType).optional(),
  owner_user_id: z.string().uuid().optional(),
})

export const addUserToOrganizationSchema = z.object({
  role_id: z.string().uuid(),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
export type AddUserToOrganizationInput = z.infer<
  typeof addUserToOrganizationSchema
>

export const getOrgMemberRoleFilterSchema = z.object({
  select: z.nativeEnum(RoleSelect).default(RoleSelect.All),
})

export type OrgMemberRoleFilters = z.infer<typeof getOrgMemberRoleFilterSchema>
