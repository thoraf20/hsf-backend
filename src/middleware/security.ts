import helmet from 'helmet'
import { Application } from 'express'

export default function setupSecurity(app: Application) {
  app.use(helmet())
}
