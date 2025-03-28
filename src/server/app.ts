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

// import { Admin } from '../application/useCases/Admin'
// import { UserRepository } from '../infrastructure/repositories/user/UserRepository'
const app: Application = express()

app.use(cors())

app.use(express.json({ limit: '10kb' })) // Max 10KB JSON payload
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

app.use(helmet())
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  next()
})

// Recommended: Using helmet for comprehensive security headers
app.use(helmet.frameguard({ action: 'deny' })) // X-Frame-Options
app.use(helmet.noSniff()) // X-Content-Type-Options

app.use(xssClean())
app.use(hpp())
app.use(speedLimiter)
app.use(morgan('combined'))
app.use(morgan('dev'))

// const userRepo = new UserRepository
// const create_admin = new Admin(userRepo)

// create_admin.createAdmin({
//   first_name: "Super",
//   last_name: "Admin",
//   email : process.env.ADMIN_EMAIL,
//   phone_number: process.env.ADMIN_PHONE,
//   password: process.env.ADMIN_PASS,
//   is_email_verified:  true
// })

app.get('/', (req: Request, res: Response) => {
  res
    .status(200)
    .json({
      message: '✅ Sever is ready and ok',
      ip: `Application was connected  from ${req.ip}`,
      url: req.originalUrl,
      statusCode: StatusCodes.OK,
    })
})
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

app.listen(PORT, () => {
  console.log('Server is running on port http://localhost:' + PORT)
})
