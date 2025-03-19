export interface ApiResponse<T> {
  statusCode: number
  message: string
  body?: T
}

export function createResponse<T>(
  statusCode: number,
  message: string,
  body?: T,
): ApiResponse<T> {
  return {
    statusCode,
    message,
    body,
  }
}
