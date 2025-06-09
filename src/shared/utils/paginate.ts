import { NextFunction, Request, Response } from 'express'
import { z, ZodError } from 'zod'
import { StatusCodes } from 'http-status-codes'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { Knex } from 'knex'
import {
  SeekPaginationOption,
  SeekPaginationResult,
} from '@shared/types/paginate'

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

export const validateRequestQuery = <Schema extends z.ZodSchema<any>>(
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

export async function applyPagination<T>(
  baseQuery: Knex.QueryBuilder,
  filters?: SeekPaginationOption,
): Promise<SeekPaginationResult<T>> {
  const page = filters?.page_number ?? 1
  const perPage = filters?.result_per_page ?? 10
  const offset = (page - 1) * perPage

  // Clone the base query for counting
  const totalRecordsQuery = baseQuery
    .clone()
    .clearSelect()
    .clearOrder()
    .clearGroup()
    .count('* as count')
    .first()

  const [{ count }] = await Promise.all([totalRecordsQuery])
  const total = Number(count)

  let dataQuery: Knex.QueryBuilder<any, any[]>
  if (offset === Number.MAX_SAFE_INTEGER) {
    dataQuery = baseQuery
  } else {
    dataQuery = baseQuery.limit(perPage).offset(offset)
  }
  // Apply limit and offset to the data query

  const data = await dataQuery

  const totalPages = Math.ceil(total / perPage)

  return new SeekPaginationResult<T>({
    result: data as T[],
    result_per_page: perPage,
    page,
    total_records: total,
    total_pages: totalPages,
    next_page: page < totalPages ? page + 1 : null,
    prev_page: page > 1 ? page - 1 : null,
  })
}
