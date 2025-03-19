import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import setupSecurity from '../middleware/security'
import rateLimiter from '../middleware/rateLimiter'
import { ErrorHandler } from '../middleware/errors/errorHandler'
import '../infrastructure/database/dbConnect'
import morgan from 'morgan'
import helmet from 'helmet'
import { StatusCodes } from 'http-status-codes'
import IndexRouters from '../presentation/routes/index'
import '../infrastructure/cache/redisClient'
const app: Application = express()

app.use(cors())

app.use(express.json())
app.use(helmet())
app.use(morgan('combined'))
app.use(morgan('dev'))

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message:  "✅ Sever is ready and ok", ip: `Application was connected  from ${req.ip}`, url : req.originalUrl, statusCode: StatusCodes.OK})
})
app.use('/api/v1', IndexRouters)
app.all('*', (req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    statusCode: StatusCodes.NOT_FOUND,
    message: `Authentication is required or wrong routes was visited ${req.method} : ${req.url} : ${req.ip}`,
  });
});
app.use(rateLimiter)
setupSecurity(app)
app.use(ErrorHandler)

const PORT = process.env.PORT || 3000 

app.listen(PORT, () => {
  console.log('Server is running on port http://localhost:' + PORT)
})
