import { withPaginateSchema } from '@shared/utils/paginate'
import { z } from 'zod'

export const sessionFilterSchema = withPaginateSchema(
  z.object({
    user_id: z.string().optional(),
    organization_id: z.string().optional(),
  }),
)

export type SessionFilters = z.infer<typeof sessionFilterSchema>
