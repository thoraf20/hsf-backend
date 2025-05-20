import { z } from 'zod'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { Role, RoleSelect } from '@domain/enums/rolesEmun'
import { withPaginateSchema } from '@shared/utils/paginate'
import { parse } from 'date-fns'

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

export const getLenderFilterSchema = withPaginateSchema(
  z.object({
    lender_name: z.string().optional(),
    cac: z.string().optional(),
  }),
)

export type LenderFilters = z.infer<typeof getLenderFilterSchema>

export const createLenderAdminSchema = z.object({
  first_name: z.string().min(2).max(100),
  last_name: z.string().min(2).max(100),
  phone_number: z.string().nonempty(),
  email: z.string().email().max(255),
  date_of_birth: z
    .string()
    .refine((datestr) => parse(datestr, 'dd/MM/yyyy', '05/02/2025'), {
      message: 'Invalid date format',
    }),
  is_active: z.boolean().default(false),

  lender_name: z.string().nonempty(),
  lender_institution_type: z.string().nonempty(),
  lender_registration_number: z.string().nonempty(),
  lender_address_line: z.string().nonempty(),
  lender_logo: z.string().url(),
  lender_state: z.string().nonempty(),
  lender_city: z.string().nonempty(),
})

export type CreateLenderInput = z.infer<typeof createLenderAdminSchema>

export const createHsfAdminSchema = z.object({
  first_name: z.string().min(2).max(100),
  last_name: z.string().min(2).max(100),
  phone_number: z.string().nonempty(),
  email: z.string().email().max(255),
  date_of_birth: z
    .string()
    .refine((datestr) => parse(datestr, 'dd/MM/yyyy', '05/02/2025'), {
      message: 'Invalid date format',
    }),
  role_id: z.string().nonempty(),
  country: z.string().nonempty().max(50),
  is_active: z.boolean().default(false),
  state: z.string().nonempty().max(50),
  city: z.string().nonempty().max(50),
  street_address: z.string().nonempty().max(500),
  state_code: z.string().optional(),
  country_code: z.string().optional(),
})

export type CreateHSFAdminInput = z.infer<typeof createHsfAdminSchema>

export const getHsfAdminFiltersSchema = withPaginateSchema(
  z.object({
    role: z.array(z.literal(Role.HSF_ADMIN)).optional(),
  }),
)

export type HSFAdminFilters = z.infer<typeof getHsfAdminFiltersSchema>

export const getHsfSubAdminFiltersSchema = withPaginateSchema(
  z.object({
    role: z
      .array(
        z.enum([
          Role.HSF_LOAN_OFFICER,
          Role.HSF_COMPLIANCE_OFFICER,
          Role.HSF_INSPECTION_MANAGER,
          Role.HSF_DISPUTE_MANAGER,
          Role.HSF_CUSTOMER_SUPPORT,
        ]),
      )
      .optional(),
  }),
)

export type HSFSubAdminFilters = z.infer<typeof getHsfSubAdminFiltersSchema>
