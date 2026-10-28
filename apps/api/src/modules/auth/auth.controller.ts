import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerRequestSchema,
  resetPasswordSchema,
  usernameAvailabilityQuerySchema,
  verifyEmailSchema,
  type AuthResponse,
  type ChangePasswordInput,
  type ForgotPasswordInput,
  type LoginInput,
  type RefreshTokenInput,
  type RegisterRequest,
  type ResetPasswordInput,
  type VerifyEmailInput,
} from "@ig/shared";
import type { CookieOptions, Request, Response } from "express";
import { CurrentUser, Public, type AuthContext } from "../../common/auth/auth-context";
import { AppError } from "../../common/errors/app-error";
import { ZodBody, ZodQuery } from "../../common/validation/zod-decorators";
import { API_PREFIX } from "../../app.setup";
import { ENV } from "../../config/config.module";
import type { Env } from "../../config/env";
import { AuthService, type AuthResult } from "./auth.service";
import type { ClientMeta } from "./session.service";
import { SessionService } from "./session.service";

export const REFRESH_COOKIE = "ig_rt";

/** Mobile clients keep the refresh token in secure storage instead of a cookie */
const isMobileClient = (req: Request) => req.headers["x-client"] === "mobile";

const clientMeta = (req: Request): ClientMeta => ({
  userAgent: req.headers["user-agent"]?.slice(0, 500) ?? null,
  ip: req.ip ?? null,
  deviceName: (req.headers["x-device-name"] as string | undefined)?.slice(0, 100) ?? null,
});

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
    @Inject(ENV) private readonly env: Env
  ) {}

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.env.NODE_ENV === "production",
      sameSite: "lax",
      // Sent only to auth endpoints, never to the rest of the API
      path: `/${API_PREFIX}/auth`,
      maxAge: this.env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    };
  }

  private respond(result: AuthResult, req: Request, res: Response): AuthResponse {
    const { refreshToken, ...body } = result;
    if (isMobileClient(req)) return { ...body, refreshToken };
    res.cookie(REFRESH_COOKIE, refreshToken, this.cookieOptions());
    return body;
  }

  private clearCookie(res: Response) {
    const { maxAge: _maxAge, ...options } = this.cookieOptions();
    res.clearCookie(REFRESH_COOKIE, options);
  }

  @Public()
  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: "Create an account and sign in" })
  async register(
    @ZodBody(registerRequestSchema) body: RegisterRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponse> {
    return this.respond(await this.auth.register(body, clientMeta(req)), req, res);
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: "Sign in with username or email" })
  async login(
    @ZodBody(loginSchema) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponse> {
    return this.respond(await this.auth.login(body, clientMeta(req)), req, res);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rotate the refresh token and get a new access token" })
  async refresh(
    @ZodBody(refreshTokenSchema) body: RefreshTokenInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponse> {
    const token = body.refreshToken ?? (req.cookies?.[REFRESH_COOKIE] as string | undefined);
    if (!token) {
      throw new AppError("MISSING_REFRESH_TOKEN", "No session", HttpStatus.UNAUTHORIZED);
    }
    try {
      return this.respond(await this.auth.refresh(token, clientMeta(req)), req, res);
    } catch (error) {
      // A dead session must not leave a stale cookie behind (except during a benign race)
      if (error instanceof AppError && error.code !== "REFRESH_TOKEN_STALE") this.clearCookie(res);
      throw error;
    }
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Sign out of the current session" })
  async logout(@CurrentUser() auth: AuthContext, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(auth);
    this.clearCookie(res);
  }

  @Post("logout-all")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Sign out of every session" })
  async logoutAll(@CurrentUser() auth: AuthContext, @Res({ passthrough: true }) res: Response) {
    await this.auth.logoutAll(auth);
    this.clearCookie(res);
  }

  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: "Confirm the email with the 6-digit code" })
  verifyEmail(@CurrentUser() auth: AuthContext, @ZodBody(verifyEmailSchema) body: VerifyEmailInput) {
    return this.auth.verifyEmail(auth, body.code);
  }

  @Post("verify-email/resend")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: "Send a new email verification code" })
  resendVerification(@CurrentUser() auth: AuthContext) {
    return this.auth.resendVerification(auth);
  }

  @Public()
  @Post("password/forgot")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: "Email a password reset code (always 204)" })
  forgotPassword(@ZodBody(forgotPasswordSchema) body: ForgotPasswordInput) {
    return this.auth.forgotPassword(body.email);
  }

  @Public()
  @Post("password/reset")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: "Set a new password with the emailed code; signs out everywhere" })
  resetPassword(@ZodBody(resetPasswordSchema) body: ResetPasswordInput) {
    return this.auth.resetPassword(body);
  }

  @Post("password/change")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change the password; other sessions are signed out" })
  changePassword(
    @CurrentUser() auth: AuthContext,
    @ZodBody(changePasswordSchema) body: ChangePasswordInput
  ) {
    return this.auth.changePassword(auth, body);
  }

  @Get("sessions")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Active sessions of the current user" })
  listSessions(@CurrentUser() auth: AuthContext) {
    return this.sessions.list(auth.userId, auth.sessionId);
  }

  @Delete("sessions/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "End one of your sessions" })
  async revokeSession(
    @CurrentUser() auth: AuthContext,
    @Param("id", new ParseUUIDPipe()) id: string
  ) {
    if (!(await this.sessions.revokeOwn(auth.userId, id))) {
      throw new AppError("SESSION_NOT_FOUND", "Session not found", HttpStatus.NOT_FOUND);
    }
  }

  @Public()
  @Get("username-available")
  @ApiOperation({ summary: "Check a username while the user types" })
  usernameAvailable(@ZodQuery(usernameAvailabilityQuerySchema) query: { username: string }) {
    return this.auth.usernameAvailability(query.username);
  }
}
