import { generateRandomString, type RandomReader } from '@oslojs/crypto/random'
import crypto from 'crypto'
import { DateTime } from 'luxon'

export const changeTimeStamp = (isoString: string) => {
  const dt = DateTime.fromISO(isoString, { zone: 'utc' })
  if (!dt.isValid) throw new Error('Invalid ISO string')

  return dt.toFormat('HH:mm')
}

const random: RandomReader = {
  read(bytes) {
    crypto.getRandomValues(bytes)
  },
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function generateRandomPassword() {
  return generateRandomString(random, alphabet, 8)
}

export function generateRandomSixNumbers(): number {
  return Math.floor(100000 + Math.random() * 900000)
}
export function generateDefaultPassword(): string {
  const randomNumber = generateRandomSixNumbers()
  let randomText = Math.random().toString(36).substring(2, 8) // Generates a random alphanumeric string
  randomText = randomText.charAt(0).toUpperCase() + randomText.slice(1) // Capitalize the first letter
  return `${randomText}@${randomNumber}`
}

export function generateTransactionId(): string {
  const timestamp = Date.now().toString(36)
  const randomString = Math.random().toString(36).substring(2, 10)
  return `TX-${timestamp}-${randomString.toUpperCase()}`
}

export function generateReferenceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `REF-${timestamp}-${randomString}`
}

export async function syncToCalendar(details: {
  platform: string
  meeting_link: string
  date: string
  time: string
  user_id: string
}) {
  // TODO: Integrate with Google Calendar, Zoom, Outlook etc.
  console.log(
    `Syncing meeting to ${details.platform} calendar for user ${details.user_id}`,
  )
}

export function generateInvitationToken(): string {
  const randomString = Math.random().toString(36).substring(2, 12)
  const timestamp = Date.now().toString(36)
  return `INV-${randomString.toUpperCase()}-${timestamp}`
}
// Removed redundant code block

export enum QueryBoolean {
  YES = '1',
  NO = '0',
}

export function addQueryUnionFilter(
  column: string,
  values: Array<string>,
  tablename = '',
) {
  const conditions = []

  for (let i = 0; i < values.length; i++) {
    const type = values[i].trim()
    let condition = `${tablename}${column} = '${type}'`
    conditions.push(condition)
  }

  return `( ${conditions.join(' OR ')} )`
}
