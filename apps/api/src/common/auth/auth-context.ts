import { createParamDecorator, type ExecutionContext, SetMetadata } from "@nestjs/common";
import type { Request } from "express";

/** Who is calling: set on the request by JwtAuthGuard */
export interface AuthContext {
  userId: string;
  /** Session family id: stable across refresh-token rotations */
  sessionId: string;
}

export type AuthenticatedRequest = Request & { auth?: AuthContext };

export const IS_PUBLIC = "isPublic";

/** Marks a route (or controller) as reachable without an access token */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** `@CurrentUser() auth: AuthContext` — only valid on non-public routes */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.auth) throw new Error("CurrentUser used on a route without JwtAuthGuard");
  return request.auth;
});
