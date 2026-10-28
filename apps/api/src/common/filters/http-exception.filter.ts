import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";

export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

const DEFAULT_CODES: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  429: "TOO_MANY_REQUESTS",
};

/** Turns every thrown error into the single API error format from docs/04-api.md */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);

    if (body.statusCode >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ApiErrorBody {
    if (!(exception instanceof HttpException)) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      };
    }

    const statusCode = exception.getStatus();
    const payload = exception.getResponse();
    const fallbackCode = DEFAULT_CODES[statusCode] ?? "ERROR";

    if (typeof payload === "string") {
      return { statusCode, code: fallbackCode, message: payload };
    }

    const { code, message, details } = payload as {
      code?: string;
      message?: string | string[];
      details?: unknown;
    };

    return {
      statusCode,
      code: code ?? fallbackCode,
      message: Array.isArray(message) ? message.join("; ") : (message ?? exception.message),
      ...(details !== undefined && { details }),
    };
  }
}
