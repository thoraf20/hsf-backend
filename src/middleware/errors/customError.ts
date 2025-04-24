import { ApplicationError, ErrorCode } from '@shared/utils/error'

export class ApplicationCustomError extends ApplicationError {
  constructor(
    statusCode: number,
    message: string,
    body = null,
    error_code?: ErrorCode,
  ) {
    super(message, statusCode, body, error_code)
  }

  serialize(): { message: string } {
    return { message: this.message }
  }
}
