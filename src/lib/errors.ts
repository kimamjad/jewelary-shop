export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: unknown

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR", details?: unknown) {
    super(message)
    this.name = "AppError"
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details)
    this.name = "ValidationError"
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super(message, 401, "AUTH_ERROR")
    this.name = "AuthError"
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, "NOT_FOUND")
    this.name = "NotFoundError"
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "خطای ناشناخته رخ داده است"
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("network") ||
      error.message.includes("fetch") ||
      error.message.includes("Failed to fetch")
    )
  }
  return false
}
