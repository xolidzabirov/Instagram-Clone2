import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import type { SessionInfo } from "@ig/shared";
import { v7 as uuidv7 } from "uuid";
import { AppError } from "../../common/errors/app-error";
import { ENV } from "../../config/config.module";
import type { Env } from "../../config/env";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { TokenService } from "./token.service";

export interface ClientMeta {
  userAgent: string | null;
  ip: string | null;
  deviceName: string | null;
}

export interface IssuedRefreshToken {
  refreshToken: string;
  /** Session family id, also the `sid` claim of access tokens */
  sessionId: string;
  userId: string;
}

/** A rotated token presented again within this window is a benign race (two tabs), not theft */
const REUSE_GRACE_MS = 20_000;

/**
 * Refresh-token sessions with rotation.
 * Every refresh revokes the presented token and issues a new one in the same family.
 * Presenting an already-rotated token again revokes the whole family (token theft).
 */
@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    @Inject(ENV) private readonly env: Env
  ) {}

  private expiresAt() {
    return new Date(Date.now() + this.env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  }

  async create(userId: string, meta: ClientMeta): Promise<IssuedRefreshToken> {
    const refreshToken = this.tokens.generateRefreshToken();
    const sessionId = uuidv7();
    await this.prisma.session.create({
      data: {
        userId,
        familyId: sessionId,
        refreshTokenHash: this.tokens.hashToken(refreshToken),
        expiresAt: this.expiresAt(),
        ...meta,
      },
    });
    return { refreshToken, sessionId, userId };
  }

  async rotate(refreshToken: string, meta: ClientMeta): Promise<IssuedRefreshToken> {
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: this.tokens.hashToken(refreshToken) },
    });

    if (!session) {
      throw new AppError("INVALID_REFRESH_TOKEN", "Session not found", HttpStatus.UNAUTHORIZED);
    }
    if (session.revokedAt) {
      await this.handleReuse(session.familyId, session.revokedAt);
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new AppError("REFRESH_TOKEN_EXPIRED", "Session expired", HttpStatus.UNAUTHORIZED);
    }

    const next = this.tokens.generateRefreshToken();
    const rotated = await this.prisma.$transaction(async (tx) => {
      // Conditional update: only one of two concurrent refreshes can win
      const { count } = await tx.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (count === 0) return false;

      await tx.session.create({
        data: {
          userId: session.userId,
          familyId: session.familyId,
          refreshTokenHash: this.tokens.hashToken(next),
          expiresAt: this.expiresAt(),
          // The family keeps its original start time for the sessions list
          createdAt: session.createdAt,
          userAgent: meta.userAgent ?? session.userAgent,
          ip: meta.ip ?? session.ip,
          deviceName: meta.deviceName ?? session.deviceName,
        },
      });
      return true;
    });

    if (!rotated) {
      throw new AppError("REFRESH_TOKEN_STALE", "Session was just refreshed", HttpStatus.UNAUTHORIZED);
    }
    return { refreshToken: next, sessionId: session.familyId, userId: session.userId };
  }

  private async handleReuse(familyId: string, revokedAt: Date): Promise<never> {
    if (Date.now() - revokedAt.getTime() < REUSE_GRACE_MS) {
      throw new AppError("REFRESH_TOKEN_STALE", "Session was just refreshed", HttpStatus.UNAUTHORIZED);
    }
    await this.revokeFamily(familyId);
    throw new AppError(
      "REFRESH_TOKEN_REUSED",
      "Refresh token reuse detected, session revoked",
      HttpStatus.UNAUTHORIZED
    );
  }

  /** True when the session family is alive and its user may use the API */
  async isActive(userId: string, sessionId: string): Promise<boolean> {
    const session = await this.prisma.session.findFirst({
      where: {
        familyId: sessionId,
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { status: "ACTIVE", deletedAt: null },
      },
      select: { id: true },
    });
    return session !== null;
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string, exceptSessionId?: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(exceptSessionId && { familyId: { not: exceptSessionId } }),
      },
      data: { revokedAt: new Date() },
    });
  }

  async list(userId: string, currentSessionId: string): Promise<SessionInfo[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: "desc" },
    });
    return sessions.map((session) => ({
      id: session.familyId,
      deviceName: session.deviceName,
      userAgent: session.userAgent,
      ip: session.ip,
      createdAt: session.createdAt.toISOString(),
      lastUsedAt: session.lastUsedAt.toISOString(),
      isCurrent: session.familyId === currentSessionId,
    }));
  }

  /** Revokes one of the user's own sessions; false when it does not belong to them */
  async revokeOwn(userId: string, sessionId: string): Promise<boolean> {
    const { count } = await this.prisma.session.updateMany({
      where: { userId, familyId: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count > 0;
  }
}
