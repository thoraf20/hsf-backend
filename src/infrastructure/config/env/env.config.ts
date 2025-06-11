import { type TypeOf, z } from 'zod'
import dotenv from 'dotenv'
import logger from '@middleware/logger'
import { isSupportedTimeUnit, parseStrTimeUnit } from '@shared/utils/time-unit'

dotenv.config()

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),
  PORT: z.string(),
  DB_HOST: z.string(),
  DB_PORT: z.string(),
  DB_USER: z.string(),
  DB_NAME: z.string(),
  DB_PASSWORD: z.string(),
  REDIS_URL: z.string(),
  APP_KEY: z.string(),
  SECRET_TOKEN: z.string(),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PHONE: z.string(),
  ADMIN_PASS: z.string(),
  ADMIN_ROLEID: z.string(),
  PAYSTACK_baseURL: z.string().url(),
  PAYSTACK_SECRET_KEY: z.string(),
  SENDCHAMP_API_KEY: z.string(),
  SENDGRID_API_KEY: z.string(),
  SENDGRID_SENDER_EMAIL: z.string().email(),
  FRONTEND_URL: z.string().url(),
  MFA_RECOVERY_CODES_SIZE: z.coerce.number(),
  MFA_SECRET_KEY: z.string().nonempty(),
  TOTP_LENGTH: z.coerce.number().int().default(6),

  TOTP_EXPIRES_IN: z
    .string()
    .refine(isSupportedTimeUnit, { message: 'invalid time unit value' })
    .transform((value) => parseStrTimeUnit(value).toSeconds()!),

  REMEMBER_ME_PERIOD: z
    .string()
    .refine(isSupportedTimeUnit, { message: 'invalid time unit value' })
    .transform((value) => parseStrTimeUnit(value).toSeconds()!),

  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  ORIGINS: z.string().transform((value) => value.split(',')),
  SERVICE_INSPECTION_FEE_CODE: z.string().optional(),
  BACKEND_URL: z.string().url(),
  MFA_SECRET_LENGTH: z.coerce.number().int(),
  PLATFORM_NAME: z.string().nonempty(),
  ELASTICSEARCH_NODE: z.string().nonempty(),
  ELASTICSEARCH_API_KEY: z.string().nonempty(),
  ELASTICSEARCH_INDEX: z.string().nonempty(),
})

export const formatErrors = (
  /** @type {import('zod').ZodFormattedError<Map<string,string>,string>} */
  errors: any[],
) =>
  Object.entries(errors)
    .map(([name, value]) => {
      if (value && '_errors' in value)
        return `${name}: ${value._errors.join(', ')}\n`
    })
    .filter(Boolean)

const _serverEnv = envSchema.safeParse(process.env)

if (!_serverEnv.success) {
  logger.error(
    '❌ Invalid environment variables:\n',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ...formatErrors(_serverEnv.error.format()),
  )

  throw new Error('Invalid environment variables')
}

export const env = _serverEnv.data
Object.assign(process.env, env)

export type ServerEnv = TypeOf<typeof envSchema>
declare global {
  namespace NodeJS {
    interface ProcessEnv extends Record<keyof ServerEnv, string>, Dict<any> {}
  }
}

export function getEnv<Key extends keyof ServerEnv>(key: Key): ServerEnv[Key] {
  return env[key]
}
