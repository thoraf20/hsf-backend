import { UserStatus } from '@domain/enums/userEum'
import { z } from 'zod'

export const disableCustomerSchema = z.object({
  user_id: z.string().nonempty(),
  reason: z.string().nonempty().optional(),
  status: z.enum([UserStatus.Banned, UserStatus.Suspended]),
})

export type DisableCustomerInput = z.infer<typeof disableCustomerSchema>

export const enableCustomerSchema = z.object({
  user_id: z.string().nonempty(),
})

export type EnableCustomerInput = z.infer<typeof enableCustomerSchema>
