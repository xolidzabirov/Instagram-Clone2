import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC, type AuthenticatedRequest } from "../../common/auth/auth-context";
import { AppError } from "../../common/errors/app-error";
import { SessionService } from "./session.service";
import { TokenService } from "./token.service";

/**
 * Global guard: every route needs a valid access token unless marked @Public().
 * Besides the signature it checks that the session is not revoked and the user
 * is active, so logout-everywhere and bans take effect immediately.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly sessions: SessionService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(" ") ?? [];

    if (isPublic) {
      // Public routes still recognise a signed-in caller (e.g. a profile shows "Following")
      if (scheme === "Bearer" && token) request.auth = (await this.authenticate(token)) ?? undefined;
      return true;
    }

    if (scheme !== "Bearer" || !token) {
      throw new AppError("UNAUTHORIZED", "Access token is required", HttpStatus.UNAUTHORIZED);
    }

    const check = await this.tokens.verifyAccessToken(token);
    if (!check.valid) {
      // TOKEN_EXPIRED tells clients to refresh and retry
      throw check.reason === "EXPIRED"
        ? new AppError("TOKEN_EXPIRED", "Access token expired", HttpStatus.UNAUTHORIZED)
        : new AppError("UNAUTHORIZED", "Invalid access token", HttpStatus.UNAUTHORIZED);
    }

    if (!(await this.sessions.isActive(check.auth.userId, check.auth.sessionId))) {
      throw new AppError("SESSION_REVOKED", "Session is no longer active", HttpStatus.UNAUTHORIZED);
    }

    request.auth = check.auth;
    return true;
  }

  private async authenticate(token: string) {
    const check = await this.tokens.verifyAccessToken(token);
    if (!check.valid) return null;
    const active = await this.sessions.isActive(check.auth.userId, check.auth.sessionId);
    return active ? check.auth : null;
  }
}
