// utils/customError.ts
export class ApplicationError extends Error {
  public statusCode: number
  public body: any

  constructor(message: string, statusCode: number, body: any = null) {
    super(message)
    this.statusCode = statusCode
    this.body = body
    Error.captureStackTrace(this, this.constructor)
  }

  serialize(): { message: string } {
    return { message: this.message }
  }
}
