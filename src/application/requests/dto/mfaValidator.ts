import { MfaFlow, MfaPurpose } from '@domain/enums/userEum'
import { z } from 'zod'

export const verifyMfaSetupSchema = z.object({
  secret: z.string().nonempty().base64(),
  code: z.string().min(5),
})

export type VerifyMFASetupInput = z.infer<typeof verifyMfaSetupSchema>

export const disableMfaSchema = z
  .object({
    flow: z.enum([MfaFlow.RecoveryCode, MfaFlow.TOTP]),
    code: z.string().nonempty(),
  })
  .refine(
    ({ flow, code }) => {
      return flow === MfaFlow.TOTP ? code.length === 6 : true
    },

    { message: 'Invalid TOTP code length', path: ['code'] },
  )

export type DisableMfaInput = z.infer<typeof disableMfaSchema>

export const verifyMFaAccessSchema = z.object({
  code: z.string().nonempty(),
  flow: z.nativeEnum(MfaFlow),
  token: z.string().nonempty(),
  purpose: z.nativeEnum(MfaPurpose),
})

export type VerifyMfaAccessInput = z.infer<typeof verifyMFaAccessSchema>
