import { Google } from 'arctic'

const googleClientId = process.env.GOOGLE_CLIENT_ID || '' as string
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '' as string
const redirectUri =
  process.env.GOOGLE_REDIRECT_URI ||
  'http://localhost:3000/auth/google/callback'

export const google = new Google(
  googleClientId,
  googleClientSecret,
  redirectUri as string,
)
