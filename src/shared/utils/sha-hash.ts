import { sha256 } from '@oslojs/crypto/sha2'
import { encodeHexUpperCase } from '@oslojs/encoding'

export function hashData(payload: unknown) {
  const payloadStr = JSON.stringify(payload)
  return encodeHexUpperCase(sha256(new TextEncoder().encode(payloadStr)))
}
