import { HttpStatus, Injectable } from "@nestjs/common";
import {
  usernameSchema,
  type ChangePasswordInput,
  type CurrentUser,
  type LoginInput,
  type RegisterRequest,
  type ResetPasswordInput,
  type UsernameAvailability,
} from "@ig/shared";
import type { AuthContext } from "../../common/auth/auth-context";
import { AppError } from "../../common/errors/app-error";
import { Prisma } from "../../generated/prisma/client";
import { MailService } from "../../infra/mail/mail.service";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { UserPresenter, userPresentationInclude } from "../users/user.presenter";
import { passwordResetEmail, verificationEmail } from "./auth.mails";
import { PasswordService } from "./password.service";
import { SessionService, type ClientMeta } from "./session.service";
import { TokenService } from "./token.service";
import { VerificationService } from "./verification.service";

export interface AuthResult {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  user: CurrentUser;
}

const invalidCredentials = () =>
  new AppError("INVALID_CREDENTIALS", "Неверное имя пользователя или пароль", HttpStatus.UNAUTHORIZED);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly tokens: TokenService,
    private readonly verification: VerificationService,
    private readonly mail: MailService,
    private readonly presenter: UserPresenter
  ) {}

  async register(input: RegisterRequest, meta: ClientMeta): Promise<AuthResult> {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username: input.username }, { email: input.email }] },
      select: { username: true },
    });
    if (existing) {
      throw existing.username === input.username
        ? new AppError("USERNAME_TAKEN", "Это имя пользователя уже занято", HttpStatus.CONFLICT)
        : new AppError("EMAIL_TAKEN", "Этот email уже используется", HttpStatus.CONFLICT);
    }

    const passwordHash = await this.passwords.hash(input.password);
    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          username: input.username,
          email: input.email,
          fullName: input.fullName,
          passwordHash,
          privacySettings: { create: {} },
          notificationSettings: { create: {} },
        },
        include: userPresentationInclude,
      });
    } catch (error) {
      // Lost a race with a concurrent registration of the same username/email
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("ACCOUNT_EXISTS", "Аккаунт уже существует", HttpStatus.CONFLICT);
      }
      throw error;
    }

    await this.sendVerificationCode(user.id, user.email, user.username);
    return this.issue(user, meta);
  }

  async login(input: LoginInput, meta: ClientMeta): Promise<AuthResult> {
    const user = await this.prisma.user.findFirst({
      where: input.login.includes("@") ? { email: input.login } : { username: input.login },
      include: userPresentationInclude,
    });

    if (!user || user.deletedAt) {
      await this.passwords.verifyAgainstDummy(input.password);
      throw invalidCredentials();
    }
    if (!(await this.passwords.verify(user.passwordHash, input.password))) {
      throw invalidCredentials();
    }
    if (user.status === "BANNED") {
      throw new AppError("ACCOUNT_BANNED", "Аккаунт заблокирован", HttpStatus.FORBIDDEN);
    }

    // Logging in reactivates a deactivated account, like Instagram does
    const active =
      user.status === "DEACTIVATED"
        ? await this.prisma.user.update({
            where: { id: user.id },
            data: { status: "ACTIVE" },
            include: userPresentationInclude,
          })
        : user;

    return this.issue(active, meta);
  }

  async refresh(refreshToken: string, meta: ClientMeta): Promise<AuthResult> {
    const rotated = await this.sessions.rotate(refreshToken, meta);
    const user = await this.prisma.user.findUnique({
      where: { id: rotated.userId },
      include: userPresentationInclude,
    });
    if (!user || user.status !== "ACTIVE" || user.deletedAt) {
      await this.sessions.revokeFamily(rotated.sessionId);
      throw new AppError("ACCOUNT_UNAVAILABLE", "Account is not active", HttpStatus.UNAUTHORIZED);
    }
    return {
      accessToken: await this.tokens.signAccessToken(rotated),
      expiresIn: this.tokens.accessTokenTtlSeconds,
      refreshToken: rotated.refreshToken,
      user: this.presenter.toCurrentUser(user),
    };
  }

  logout(auth: AuthContext) {
    return this.sessions.revokeFamily(auth.sessionId);
  }

  logoutAll(auth: AuthContext) {
    return this.sessions.revokeAllForUser(auth.userId);
  }

  async verifyEmail(auth: AuthContext, code: string): Promise<CurrentUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: auth.userId },
      include: userPresentationInclude,
    });
    if (user.emailVerifiedAt) return this.presenter.toCurrentUser(user);

    await this.verification.consume(user.id, "EMAIL_VERIFY", code);
    const verified = await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
      include: userPresentationInclude,
    });
    return this.presenter.toCurrentUser(verified);
  }

  async resendVerification(auth: AuthContext): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: auth.userId } });
    if (user.emailVerifiedAt) {
      throw new AppError("EMAIL_ALREADY_VERIFIED", "Email уже подтверждён", HttpStatus.CONFLICT);
    }
    await this.sendVerificationCode(user.id, user.email, user.username);
  }

  /** Always succeeds: the response must not reveal whether the email is registered */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt || user.status === "BANNED") return;
    const code = await this.verification.issue(user.id, "PASSWORD_RESET");
    await this.mail.send(passwordResetEmail(user.email, user.username, code));
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new AppError("INVALID_CODE", "Code is invalid or expired", HttpStatus.BAD_REQUEST);
    }
    await this.verification.consume(user.id, "PASSWORD_RESET", input.code);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await this.passwords.hash(input.newPassword) },
    });
    await this.sessions.revokeAllForUser(user.id);
  }

  /** Keeps the current session, signs out every other device */
  async changePassword(auth: AuthContext, input: ChangePasswordInput): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: auth.userId } });
    if (!(await this.passwords.verify(user.passwordHash, input.currentPassword))) {
      throw new AppError("INVALID_PASSWORD", "Неверный текущий пароль", HttpStatus.BAD_REQUEST);
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await this.passwords.hash(input.newPassword) },
    });
    await this.sessions.revokeAllForUser(user.id, auth.sessionId);
  }

  async usernameAvailability(raw: string): Promise<UsernameAvailability> {
    const parsed = usernameSchema.safeParse(raw);
    if (!parsed.success) return { available: false, reason: "INVALID", suggestions: [] };

    const username = parsed.data;
    const taken = await this.prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!taken) return { available: true, suggestions: [] };

    return { available: false, reason: "TAKEN", suggestions: await this.suggestUsernames(username) };
  }

  private async suggestUsernames(base: string): Promise<string[]> {
    const stem = base.slice(0, 26);
    const candidates = [
      `${stem}_`,
      `${stem}.official`,
      `_${stem}`,
      ...Array.from({ length: 6 }, () => `${stem}${Math.floor(Math.random() * 9000) + 100}`),
    ].filter((candidate) => usernameSchema.safeParse(candidate).success);

    const takenRows = await this.prisma.user.findMany({
      where: { username: { in: candidates } },
      select: { username: true },
    });
    const taken = new Set(takenRows.map((row) => row.username));
    return candidates.filter((candidate) => !taken.has(candidate)).slice(0, 3);
  }

  private async sendVerificationCode(userId: string, email: string, username: string) {
    const code = await this.verification.issue(userId, "EMAIL_VERIFY");
    await this.mail.send(verificationEmail(email, username, code));
  }

  private async issue(
    user: Parameters<UserPresenter["toCurrentUser"]>[0],
    meta: ClientMeta
  ): Promise<AuthResult> {
    const session = await this.sessions.create(user.id, meta);
    return {
      accessToken: await this.tokens.signAccessToken(session),
      expiresIn: this.tokens.accessTokenTtlSeconds,
      refreshToken: session.refreshToken,
      user: this.presenter.toCurrentUser(user),
    };
  }
}
