import { DeclineReasonCategory } from '@domain/enums/declineReasonCategoryEnum'
import { z } from 'zod'

export const declineRequestValidator = z.object({
  cases: z.array(
    z
      .object({
        decline_reason_id: z.string().min(1).max(255).nullish(),
        reason: z.string().min(1).max(255).nullish(),
        description: z.string().min(1).max(1000),
      })
      .refine((value) => {
        if (!(value.decline_reason_id || value.reason)) {
          throw new Error('Either decline_reason_id or reason must be provided')
        }
        return value
      }),
  ),
})

export type DeclineRequestInput = z.infer<typeof declineRequestValidator>

export type DeclineRequestCase = DeclineRequestInput['cases'][number]

export const declineRequestFiltersSchema = z.object({
  category: z.nativeEnum(DeclineReasonCategory),
})

export type DeclineReasonFilters = z.infer<typeof declineRequestFiltersSchema>
