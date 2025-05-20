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