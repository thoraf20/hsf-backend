import { getEnv } from '@infrastructure/config/env/env.config'
import {
  encodeBase64,
  encodeBase32NoPadding,
  encodeBase64NoPadding,
} from '@oslojs/encoding'
import { sha256 } from '@oslojs/crypto/sha2'
import crypto from 'crypto'

export function generateRandomOTP(): string {
  const bytes = new Uint8Array(5)
  crypto.getRandomValues(bytes)
  const code = encodeBase32NoPadding(bytes)
  return code
}

export function generateRandomRecoveryCode(): string {
  const recoveryCodeBytes = new Uint8Array(10)
  crypto.getRandomValues(recoveryCodeBytes)
  const recoveryCode = encodeBase32NoPadding(recoveryCodeBytes)
  return recoveryCode
}

export function generate2faSecret(): [string, Uint8Array] {
  const bytes = new Uint8Array(getEnv('MFA_SECRET_LENGTH'))
  crypto.getRandomValues(bytes)
  return [encodeBase64(bytes), bytes]
}

export function generateRecoveryCodes(size: number) {
  const recoveryCodes = Array.from({ length: size }, () =>
    generateRandomRecoveryCode(),
  )

  const encoder = new TextEncoder()
  const hashedRecoveryCodes = recoveryCodes.map((code) => {
    return encodeBase64NoPadding(sha256(encoder.encode(code)))
  })

  return {
    recoveryCodes,
    hashedRecoveryCodes,
  }
}

export function verifyCodeFromRecoveryCodeList(
  code: string,
  recoveryCodeHashes: Array<string>,
) {
  const encoder = new TextEncoder()

  const hash = encodeBase64NoPadding(sha256(encoder.encode(code)))

  return recoveryCodeHashes.find((code) => code === hash)
}
