import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * Domain error with a machine-readable code, e.g. `USERNAME_TAKEN`.
 * Serialized by HttpExceptionFilter as { statusCode, code, message, details? }.
 */
export class AppError extends HttpException {
  constructor(
    readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    readonly details?: unknown
  ) {
    super({ code, message, details }, status);
  }
}
