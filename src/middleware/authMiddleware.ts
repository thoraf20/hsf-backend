import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string
    }
    req.user = { id: decoded.userId }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
