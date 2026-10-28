import { Inject, Injectable } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { errors, jwtVerify, SignJWT } from "jose";
import { ENV } from "../../config/config.module";
import type { Env } from "../../config/env";
import type { AuthContext } from "../../common/auth/auth-context";

const ISSUER = "ig-api";
const AUDIENCE = "ig-clients";

export type AccessTokenCheck =
  | { valid: true; auth: AuthContext }
  | { valid: false; reason: "EXPIRED" | "INVALID" };

/**
 * Access tokens: short-lived HS256 JWTs (sub = user id, sid = session family id).
 * Refresh tokens: opaque random strings; only their SHA-256 hash is stored.
 */
@Injectable()
export class TokenService {
  private readonly key: Uint8Array;

  constructor(@Inject(ENV) private readonly env: Env) {
    this.key = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  }

  get accessTokenTtlSeconds() {
    return this.env.ACCESS_TOKEN_TTL_SECONDS;
  }

  signAccessToken(auth: AuthContext): Promise<string> {
    return new SignJWT({ sid: auth.sessionId })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(auth.userId)
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(`${this.env.ACCESS_TOKEN_TTL_SECONDS}s`)
      .sign(this.key);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenCheck> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ["HS256"],
      });
      if (typeof payload.sub !== "string" || typeof payload.sid !== "string") {
        return { valid: false, reason: "INVALID" };
      }
      return { valid: true, auth: { userId: payload.sub, sessionId: payload.sid } };
    } catch (error) {
      return { valid: false, reason: error instanceof errors.JWTExpired ? "EXPIRED" : "INVALID" };
    }
  }

  generateRefreshToken(): string {
    return randomBytes(32).toString("base64url");
  }

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
