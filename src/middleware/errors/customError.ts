import { ApplicationError } from '../../utils/error'

export class ApplicationCustomError extends ApplicationError {
  constructor(statusCode: number, message: string, body = null) {
    super(message, statusCode, body)
  }

  serialize(): { message: string } {
    return { message: this.message }
  }
}
