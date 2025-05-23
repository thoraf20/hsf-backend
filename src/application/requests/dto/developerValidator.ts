import { z } from 'zod'
import { withPaginateSchema } from '@shared/utils/paginate'

export const developerFiltersSchema = withPaginateSchema(
  z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().optional(),
    company_name: z.string().optional(),
    specialization: z.string().optional(),
    // Add other potential filterable fields from DeveloperSchema as needed
    // For example:
    // years_in_business: z.string().optional(),
    // developer_role: z.string().optional(),
  }),
)

export type DeveloperFilters = z.infer<typeof developerFiltersSchema>

export const createDeveloperSchema = z.object({
  company_name: z.string().min(2).max(255),
  company_registration_number: z.string().nonempty().max(50),
  office_address: z.string().nonempty().max(500),
  company_email: z.string().nonempty().email().max(255),
  state: z.string().nonempty().max(100),
  city: z.string().nonempty().max(100),
  specialization: z.string().nonempty(),
  company_image: z.string().nonempty(),
  year_in_business: z.coerce.number().int(),
  operation_states: z.string().nonempty(),

  first_name: z.string().nonempty().max(100),
  last_name: z.string().nonempty().max(100),
  email: z.string().email(),
  phone_number: z.string(),
  developer_type: z.string().optional(),

  documents: z.array(
    z.object({
      id: z.string().nonempty(),
      file_url: z.string().url(),
      file_name: z.string(),
      file_size: z.number().optional(),
      file_ext: z.string().optional(),
    }),
  ),
})

export type CreateDeveloperInput = z.infer<typeof createDeveloperSchema>
