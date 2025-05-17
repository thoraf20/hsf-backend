import { ErrorRequestHandler, NextFunction, Response, Request } from 'express'
import { ApplicationError } from '@shared/utils/error'
import { StatusCodes } from 'http-status-codes'
import logger from '../logger'
import { createResponse } from '@presentation/response/responseType'

export const ErrorHandler: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error instanceof ApplicationError) {
    const response = createResponse(
      error.statusCode,
      error.serialize().message,
      error.body,
      error.error_code,
    )
    res.status(response.statusCode).json(response)
    return next()
  } else {
    logger.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message:
        'Oops! Something went wrong. Please bear with us, we will be back online soon...',
    })
    return next()
  }
}
