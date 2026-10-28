import { HttpStatus, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";
import { AppError } from "../errors/app-error";

/** Validates a request part against a Zod schema from @ig/shared */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_";
      fields[key] ??= issue.message;
    }

    throw new AppError("VALIDATION_ERROR", "Validation failed", HttpStatus.BAD_REQUEST, {
      fields,
    });
  }
}
