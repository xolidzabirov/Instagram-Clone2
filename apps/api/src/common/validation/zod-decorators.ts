import { applyDecorators, Body, Query } from "@nestjs/common";
import { ApiBody, ApiQuery } from "@nestjs/swagger";
import { z, type ZodType } from "zod";
import { ZodValidationPipe } from "./zod-validation.pipe";

function toOpenApi(schema: ZodType) {
  return z.toJSONSchema(schema, { io: "input", unrepresentable: "any" }) as Record<string, unknown>;
}

/** `@ZodBody(loginSchema) body: LoginInput` — validates the body and documents it in Swagger */
export function ZodBody<T>(schema: ZodType<T>): ParameterDecorator {
  const validate = Body(new ZodValidationPipe(schema));
  const document = ApiBody({ schema: toOpenApi(schema) });

  return (target, propertyKey, parameterIndex) => {
    validate(target, propertyKey, parameterIndex);
    if (propertyKey !== undefined) {
      const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
      if (descriptor) applyDecorators(document)(target, propertyKey, descriptor);
    }
  };
}

/** `@ZodQuery(paginationSchema) query: PaginationInput` */
export function ZodQuery<T>(schema: ZodType<T>): ParameterDecorator {
  const validate = Query(new ZodValidationPipe(schema));
  const document = ApiQuery({ name: "query", required: false, schema: toOpenApi(schema) });

  return (target, propertyKey, parameterIndex) => {
    validate(target, propertyKey, parameterIndex);
    if (propertyKey !== undefined) {
      const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
      if (descriptor) applyDecorators(document)(target, propertyKey, descriptor);
    }
  };
}
