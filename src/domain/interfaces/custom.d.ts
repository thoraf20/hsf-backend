// custom.d.ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Request } from 'express'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        // Add other user properties if needed
      }
    }
  }
}
