import { getRequestStorage } from '@middleware/requestContext'

export function getRequestContextValue<T>(key: string): T | undefined {
  const store = getRequestStorage().getStore()
  return store?.get(key)
}

export function getIpAddress(): string | undefined {
  return getRequestContextValue<string>('ipAddress')
}

export function getUserAgent(): string | undefined {
  return getRequestContextValue<string>('userAgent')
}
