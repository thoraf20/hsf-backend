import { getEnv } from './env/env.config'

export const serviceProductFeeCodes = {
  INSPECTION_FEE: getEnv('SERVICE_INSPECTION_FEE_CODE'),
}
