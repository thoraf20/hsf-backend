import { Google } from 'arctic'

const googleClientId = process.env.GOOGLE_CLIENT_ID || ''
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
const redirectUri =
  process.env.GOOGLE_REDIRECT_URI ||
  'http://localhost:3000/auth/google/callback'

export const google = new Google(
  googleClientId,
  googleClientSecret,
  redirectUri,
)
