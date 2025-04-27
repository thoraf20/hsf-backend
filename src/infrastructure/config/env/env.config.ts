import { type TypeOf, z } from 'zod'
import dotenv from 'dotenv'
import logger from '@middleware/logger'

dotenv.config()


export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.string(),
  
  // Database
  DB_HOST: z.string(),
  DB_PORT: z.string(),
  DB_USER: z.string(),
  DB_NAME: z.string(),
  DB_PASSWORD: z.string(),

  // Redis
  REDIS_URL: z.string(),

  // App
  APP_KEY: z.string(),
  SECRET_TOKEN: z.string(),

  // Admin
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PHONE: z.string(),
  ADMIN_PASS: z.string(),
  ADMIN_ROLEID: z.string(),

  // Paystack
  PAYSTACK_baseURL: z.string().url(),
  PAYSTACK_SECRET_KEY: z.string(),

  // Sendchamp
  SENDCHAMP_API_KEY: z.string(),

  // Sendgrid
  SENDGRID_API_KEY: z.string(),
  SENDGRID_SENDER_EMAIL: z.string().email(),

  // Frontend
  FRONTEND_URL: z.string().url(),

  // AWS (if you still plan to include them)
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_BUCKET_NAME: z.string(),

  // Google Auth
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),

  // Other
  ORIGINS: z.string().transform((value) => value.split(',')),
  SERVICE_INSPECTION_FEE_CODE: z.string().optional(),
});

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
  // logger.error(
  //   '❌ Invalid environment variables:\n',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
  //   ...formatErrors(_serverEnv.error.format()),
  // )

  // throw new Error('Invalid environment variables')
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
