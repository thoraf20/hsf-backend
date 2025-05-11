import { z } from 'zod'

export const verifyMfaSetupSchema = z.object({
  secret: z.string().nonempty().base64(),
  code: z.string().min(5),
  token: z.string().nonempty(),
})

export type VerifyMFASetupInput = z.infer<typeof verifyMfaSetupSchema>
