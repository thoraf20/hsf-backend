// utils/customError.ts
export class ApplicationError extends Error {
  public statusCode: number
  public body: any
  public error_code?: string

  constructor(
    message: string,
    statusCode: number,
    body: any = null,
    error_code?: string,
  ) {
    super(message)
    this.statusCode = statusCode
    this.body = body
    this.error_code = error_code
    Error.captureStackTrace(this, this.constructor)
  }

  serialize(): { message: string } {
    return { message: this.message }
  }
}

export enum ErrorCode {
  MISSING_PREQUALIFIER = 'missing_prequalifier',
  NON_APPROVED_PREQUALIFIER = 'non_approved_prequalifier',
  REQUIRED_INSPECTION = 'required_inspection',
}
