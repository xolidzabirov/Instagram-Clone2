import { isAxiosError } from "axios";

/** Error in the API's unified format: { statusCode, code, message, details? } (docs/04-api.md) */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    /** Machine-readable reason, e.g. "INVALID_CREDENTIALS"; "NETWORK_ERROR" when the API is unreachable */
    readonly code: string,
    message: string,
    readonly details?: { fields?: Record<string, string> } & Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Per-field validation messages from a VALIDATION_ERROR response */
  get fieldErrors(): Record<string, string> {
    return this.details?.fields ?? {};
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (isAxiosError(error)) {
    const body = error.response?.data as { code?: string; message?: string; details?: ApiError["details"] } | undefined;
    if (!error.response) return new ApiError(0, "NETWORK_ERROR", error.message);
    return new ApiError(error.response.status, body?.code ?? "UNKNOWN", body?.message ?? error.message, body?.details);
  }
  return new ApiError(0, "UNKNOWN", error instanceof Error ? error.message : String(error));
}
