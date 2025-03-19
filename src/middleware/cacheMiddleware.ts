import { Request, Response, NextFunction } from 'express'

declare module 'express-serve-static-core' {
  interface Response {
    sendResponse?: (body?: any) => Response
  }
}
import redis from '../infrastructure/cache/redisClient'

export const cacheMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const cachedData = await redis.get(req.originalUrl)
  if (cachedData) return res.json(JSON.parse(cachedData))

  res.sendResponse = res.json
  res.json = (body): Response => {
    redis.set(req.originalUrl, JSON.stringify(body), 'EX', 3600)
    if (res.sendResponse) {
      return res.sendResponse(body)
    }
    return res.json(body)
  }

  next()
}
