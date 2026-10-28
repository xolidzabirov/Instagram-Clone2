import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { AppError } from "../../common/errors/app-error";
import { ENV } from "../../config/config.module";
import type { Env } from "../../config/env";
import type { VerificationCodeType } from "../../generated/prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/** 6-digit one-time codes for email verification and password reset */
@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env
  ) {}

  private hash(userId: string, type: VerificationCodeType, code: string) {
    return createHmac("sha256", this.env.JWT_ACCESS_SECRET)
      .update(`${type}:${userId}:${code}`)
      .digest("hex");
  }

  /** Creates a new code and invalidates any previous unused one of the same type */
  async issue(userId: string, type: VerificationCodeType): Promise<string> {
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    await this.prisma.$transaction([
      this.prisma.verificationCode.updateMany({
        where: { userId, type, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.verificationCode.create({
        data: {
          userId,
          type,
          codeHash: this.hash(userId, type, code),
          expiresAt: new Date(Date.now() + CODE_TTL_MS),
        },
      }),
    ]);
    return code;
  }

  /** Consumes the code or throws INVALID_CODE / TOO_MANY_ATTEMPTS */
  async consume(userId: string, type: VerificationCodeType, code: string): Promise<void> {
    const record = await this.prisma.verificationCode.findFirst({
      where: { userId, type, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!record) {
      throw new AppError("INVALID_CODE", "Code is invalid or expired", HttpStatus.BAD_REQUEST);
    }
    if (record.attempts >= MAX_ATTEMPTS) {
      throw new AppError("TOO_MANY_ATTEMPTS", "Request a new code", HttpStatus.TOO_MANY_REQUESTS);
    }

    const expected = Buffer.from(record.codeHash, "hex");
    const actual = Buffer.from(this.hash(userId, type, code), "hex");
    if (!timingSafeEqual(expected, actual)) {
      await this.prisma.verificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new AppError("INVALID_CODE", "Code is invalid or expired", HttpStatus.BAD_REQUEST);
    }

    await this.prisma.verificationCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
  }
}
