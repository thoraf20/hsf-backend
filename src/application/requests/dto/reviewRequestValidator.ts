import { z } from 'zod'

export const reviewRequestFilterSchema = z.object({
  status: z.string().optional(),
  organization_id: z.string().nonempty().optional(),
  user_id: z.string().nonempty().optional(),
  request_stage_type_ids: z
    .string()
    .nonempty()
    .transform((ids) => ids.split(','))
    .optional(),
})

export type ReviewRequestFilters = z.infer<typeof reviewRequestFilterSchema> &
  Partial<{ approver_id: string }>
