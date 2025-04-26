import { ErrorCode } from '@shared/utils/error'

export interface ApiResponse<T> {
  statusCode: number
  message: string
  body?: T
  error_code?: ErrorCode
}

export function createResponse<T>(
  statusCode: number,
  message: string,
  body?: T,
  error_code?: ErrorCode,
): ApiResponse<T> {
  return {
    statusCode,
    message,
    body,
    error_code,
  }
}
