import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import setupSecurity, { speedLimiter } from '../middleware/security'
// import rateLimiter from '../middleware/rateLimiter'
import { ErrorHandler } from '../middleware/errors/errorHandler'
import '../infrastructure/database/dbConnect'
import morgan from 'morgan'
import helmet from 'helmet'
import { StatusCodes } from 'http-status-codes'
import IndexRouters from '../presentation/routes/index'
import '../infrastructure/cache/redisClient'
import hpp from 'hpp'
import xssClean from 'xss-clean'
import cookieParser from 'cookie-parser'
import path from 'path'
import http from 'http'
import { getEnv } from '@infrastructure/config/env/env.config'
import '@infrastructure/worker/inspectionWorker'
import { asyncMiddleware } from '@routes/index.t'
// import { DeveloperRespository } from '@repositories/Agents/DeveloperRepository'
// import { LenderRepository } from '@repositories/Agents/LeaderRepository'
// import { AdminRepository } from '@repositories/Agents/AdminRepository'

// import { UserRepository } from '../infrastructure/repositories/user/UserRepository'
// import { Agents } from '@use-cases/Agent/agent'

const app: Application = express()

app.use(cookieParser())
app.use(
  cors({
    origin:
      getEnv('NODE_ENV') === 'development'
        ? [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
          ]
        : getEnv('ORIGINS'),

    credentials: true,
  }),
)
const server = http.createServer(app)
app.use(express.json({ limit: '10kb' })) // Max 10KB JSON payload
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: { action: 'deny' }, // Ensures X-Frame-Options: DENY
    // noSniff is enabled by default
  }),
)
// The lines for manual header setting and individual helmet.frameguard/noSniff calls are removed
// as their functionality is now handled by the consolidated helmet() call above.

app.use(xssClean())
app.use(hpp())
app.use(speedLimiter)
app.use(morgan('combined'))
app.use(morgan('dev'))

// const userRepo = new UserRepository()
// const create_admin = new Agents(userRepo, new DeveloperRespository(), new AdminRepository(), new LenderRepository())

// create_admin.createAdmin({
//   first_name: 'Super',
//   last_name: 'Admin',
//   email: process.env.ADMIN_EMAIL,
//   phone_number: process.env.ADMIN_PHONE,
//   password: process.env.ADMIN_PASS,
//   is_email_verified: true,
// })

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: '✅ Sever is ready and ok',
    ip: `Application was connected  from ${req.ip}`,
    url: req.originalUrl,
    statusCode: StatusCodes.OK,
  })
})

const uploadDir = path.join(process.cwd(), 'uploads') // Adjust path as needed

app.use('/uploads', asyncMiddleware(express.static(uploadDir)))
app.use('/api/v1', IndexRouters)
app.all('*', (req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    statusCode: StatusCodes.NOT_FOUND,
    message: `Authentication is required or wrong routes was visited ${req.method} : ${req.url} : ${req.ip}`,
  })
})
// app.use(rateLimiter)
setupSecurity(app)
app.use(ErrorHandler)

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(
    `Server is running on port http://localhost:${PORT} at ${new Date()}`,
  )
})
