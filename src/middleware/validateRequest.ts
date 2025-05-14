import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { ZodSchema } from 'zod'

export const validateRequest =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const firstError = result.error.errors[0]
      const field = firstError.path.join('.')
      const error = firstError.message
      res.status(400).json({
        statusCode: StatusCodes.BAD_REQUEST,
        message: `${field} is ${error}`,
      })
      return
    }

    next()
  }
