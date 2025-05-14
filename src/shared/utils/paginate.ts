import { NextFunction, Request, Response } from 'express'
import { z, ZodError } from 'zod'
import { StatusCodes } from 'http-status-codes'
import { ApplicationCustomError } from '@middleware/errors/customError'

const DEFAULT_PAGE_NUMBER = 1
const DEFAULT_PAGE_SIZE = 20

export const paginationQuerySchema = z.object({
  result_per_page: z.coerce
    .number()
    .int()
    .positive()
    .default(DEFAULT_PAGE_SIZE),
  page_number: z.coerce.number().int().positive().default(DEFAULT_PAGE_NUMBER),
})

export function withPaginateSchema<Schema extends z.ZodObject<any>>(
  schema: Schema,
) {
  return paginationQuerySchema.and(schema)
}

export const validateRequestQuery = <Schema extends z.ZodObject<any>>(
  schema: Schema,
) => {
  return function (req: Request, res: Response, next: NextFunction) {
    const { query } = req
    try {
      const parsedQuery = schema.parse(query)
      req.query = parsedQuery

      next()
    } catch (e) {
      const err = e as ZodError
      const formattedErrors = err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }))

      const response = new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid Request Query',
        formattedErrors,
      )

      next(response)
      return
    }
  }
}
