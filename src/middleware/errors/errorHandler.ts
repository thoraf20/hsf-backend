import { ErrorRequestHandler, NextFunction, Response, Request } from 'express'
import { ApplicationError } from '../../shared/utils/error'
import { StatusCodes } from 'http-status-codes'

export const ErrorHandler: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error instanceof ApplicationError) {
    res.status(error.statusCode).json({
      status: error.statusCode,
      message: error.serialize().message,
      body: error.body,
    })
    return next()
  } else {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message:
        'Oops! Something went wrong. Please bear with us, we will be back online soon...',
    })
    return next()
  }
}
