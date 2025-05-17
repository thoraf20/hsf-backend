import { z } from 'zod'

export const enableNotificationMediumSchema = z.object({
  medium_id: z.string().nonempty(),
})

export type EnableNotificationMediumInput = z.infer<
  typeof enableNotificationMediumSchema
>

export const enabledNotificationTypeSchema = z.object({
  type_id: z.string().nonempty(),
  frequency_id: z.string().nonempty().optional(),
})

export type EnableNotificationTypeInput = z.infer<
  typeof enabledNotificationTypeSchema
>
