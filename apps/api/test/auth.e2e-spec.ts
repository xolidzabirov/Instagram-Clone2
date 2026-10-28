import type { INestApplication } from "@nestjs/common";
import { SignJWT } from "jose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MailService } from "../src/infra/mail/mail.service";
import { PrismaService } from "../src/infra/prisma/prisma.service";
import { createTestApp } from "./create-test-app";
import { resetDatabase } from "./db";

const AUTH = "/api/v1/auth";
const PASSWORD = "Secret123";

let app: INestApplication;
let prisma: PrismaService;
let mail: MailService;
let counter = 0;

const http = () => request(app.getHttpServer());

/** Extracts the `ig_rt=...` pair from Set-Cookie for reuse in a Cookie header */
function refreshCookie(res: request.Response): string {
  const cookies = ([] as string[]).concat(res.headers["set-cookie"] ?? []);
  const cookie = cookies.find((c) => c.startsWith("ig_rt="));
  if (!cookie) throw new Error("ig_rt cookie not set");
  return cookie.split(";")[0]!;
}

function lastCodeFor(email: string): string {
  const message = [...mail.outbox].reverse().find((m) => m.to === email);
  const code = message?.text.match(/\b(\d{6})\b/)?.[1];
  if (!code) throw new Error(`no code emailed to ${email}`);
  return code;
}

async function register(overrides: Record<string, string> = {}) {
  counter += 1;
  const body = {
    email: `user${counter}@example.com`,
    fullName: `User ${counter}`,
    username: `user_${counter}`,
    password: PASSWORD,
    ...overrides,
  };
  const res = await http().post(`${AUTH}/register`).send(body).expect(201);
  return { body, res, token: res.body.accessToken as string, cookie: refreshCookie(res) };
}

beforeAll(async () => {
  app = await createTestApp();
  prisma = app.get(PrismaService);
  mail = app.get(MailService);
  await resetDatabase(app);
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  mail.outbox.length = 0;
});

describe("register", () => {
  it("creates the account, signs in and emails a verification code", async () => {
    const res = await http()
      .post(`${AUTH}/register`)
      .send({ email: "Alice@Example.com", fullName: "Alice", username: "Alice.Dev", password: PASSWORD })
      .expect(201);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.expiresIn).toBe(900);
    expect(res.body.refreshToken).toBeUndefined();
    expect(res.body.user).toMatchObject({
      username: "alice.dev",
      email: "alice@example.com",
      emailVerified: false,
      avatar: null,
      followersCount: 0,
    });

    const cookie = ([] as string[]).concat(res.headers["set-cookie"]).find((c) => c.startsWith("ig_rt="))!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);
    expect(lastCodeFor("alice@example.com")).toMatch(/^\d{6}$/);
  });

  it("rejects a taken username or email regardless of case", async () => {
    const { body } = await register();

    const sameUsername = await http()
      .post(`${AUTH}/register`)
      .send({ ...body, email: "other@example.com", username: body.username.toUpperCase() })
      .expect(409);
    expect(sameUsername.body.code).toBe("USERNAME_TAKEN");

    const sameEmail = await http()
      .post(`${AUTH}/register`)
      .send({ ...body, username: "someone_else", email: body.email.toUpperCase() })
      .expect(409);
    expect(sameEmail.body.code).toBe("EMAIL_TAKEN");
  });

  it("validates input with the shared schemas", async () => {
    const res = await http()
      .post(`${AUTH}/register`)
      .send({ email: "bad", fullName: "", username: "explore", password: "weak" })
      .expect(400);

    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(Object.keys(res.body.details.fields)).toEqual(
      expect.arrayContaining(["email", "fullName", "username", "password"])
    );
  });
});

describe("login", () => {
  it("accepts username or email in any case", async () => {
    const { body } = await register();
    await http().post(`${AUTH}/login`).send({ login: body.username.toUpperCase(), password: PASSWORD }).expect(200);
    const res = await http().post(`${AUTH}/login`).send({ login: body.email, password: PASSWORD }).expect(200);
    expect(res.body.user.username).toBe(body.username);
  });

  it("gives the same answer for a wrong password and an unknown user", async () => {
    const { body } = await register();
    const wrong = await http().post(`${AUTH}/login`).send({ login: body.username, password: "Wrong1234" }).expect(401);
    const unknown = await http().post(`${AUTH}/login`).send({ login: "nobody_here", password: PASSWORD }).expect(401);
    expect(wrong.body).toEqual(unknown.body);
    expect(wrong.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("refuses banned accounts", async () => {
    const { body } = await register();
    await prisma.user.update({ where: { username: body.username }, data: { status: "BANNED" } });
    const res = await http().post(`${AUTH}/login`).send({ login: body.username, password: PASSWORD }).expect(403);
    expect(res.body.code).toBe("ACCOUNT_BANNED");
  });
});

describe("access tokens", () => {
  it("protects routes by default", async () => {
    const res = await http().get(`${AUTH}/sessions`).expect(401);
    expect(res.body.code).toBe("UNAUTHORIZED");
  });

  it("lists the caller's sessions and marks the current one", async () => {
    const { token } = await register();
    const res = await http().get(`${AUTH}/sessions`).set("Authorization", `Bearer ${token}`).expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].isCurrent).toBe(true);
  });

  it("reports expired tokens with TOKEN_EXPIRED so clients know to refresh", async () => {
    const { res: registered } = await register();
    const expired = await new SignJWT({ sid: "00000000-0000-7000-8000-000000000000" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(registered.body.user.id)
      .setIssuer("ig-api")
      .setAudience("ig-clients")
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(process.env.JWT_ACCESS_SECRET));

    const res = await http().get(`${AUTH}/sessions`).set("Authorization", `Bearer ${expired}`).expect(401);
    expect(res.body.code).toBe("TOKEN_EXPIRED");
  });
});

describe("refresh", () => {
  it("rotates the cookie and returns a fresh access token", async () => {
    const { cookie } = await register();
    const res = await http().post(`${AUTH}/refresh`).set("Cookie", cookie).send({}).expect(200);
    expect(refreshCookie(res)).not.toBe(cookie);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it("treats an immediate second use as a harmless race between tabs", async () => {
    const { cookie, token } = await register();
    await http().post(`${AUTH}/refresh`).set("Cookie", cookie).send({}).expect(200);
    const res = await http().post(`${AUTH}/refresh`).set("Cookie", cookie).send({}).expect(401);
    expect(res.body.code).toBe("REFRESH_TOKEN_STALE");
    // The session itself stays alive
    await http().get(`${AUTH}/sessions`).set("Authorization", `Bearer ${token}`).expect(200);
  });

  it("revokes the whole session when an old refresh token is replayed later", async () => {
    const { cookie, token, res: registered } = await register();
    const rotated = await http().post(`${AUTH}/refresh`).set("Cookie", cookie).send({}).expect(200);

    // Pretend the stolen token is replayed long after it was rotated
    await prisma.session.updateMany({
      where: { userId: registered.body.user.id, revokedAt: { not: null } },
      data: { revokedAt: new Date(Date.now() - 60_000) },
    });

    const replay = await http().post(`${AUTH}/refresh`).set("Cookie", cookie).send({}).expect(401);
    expect(replay.body.code).toBe("REFRESH_TOKEN_REUSED");

    // Even the legitimate, newest token is dead now
    await http().post(`${AUTH}/refresh`).set("Cookie", refreshCookie(rotated)).send({}).expect(401);
    const access = await http().get(`${AUTH}/sessions`).set("Authorization", `Bearer ${token}`).expect(401);
    expect(access.body.code).toBe("SESSION_REVOKED");
  });

  it("uses the request body instead of cookies for mobile clients", async () => {
    const res = await http()
      .post(`${AUTH}/register`)
      .set("X-Client", "mobile")
      .send({ email: "mobile@example.com", fullName: "Mobile", username: "mobile_user", password: PASSWORD })
      .expect(201);
    expect(res.headers["set-cookie"]).toBeUndefined();
    expect(res.body.refreshToken).toEqual(expect.any(String));

    const refreshed = await http()
      .post(`${AUTH}/refresh`)
      .set("X-Client", "mobile")
      .send({ refreshToken: res.body.refreshToken })
      .expect(200);
    expect(refreshed.body.refreshToken).not.toBe(res.body.refreshToken);
  });

  it("requires a token", async () => {
    const res = await http().post(`${AUTH}/refresh`).send({}).expect(401);
    expect(res.body.code).toBe("MISSING_REFRESH_TOKEN");
  });
});

describe("logout", () => {
  it("ends the current session", async () => {
    const { token, cookie } = await register();
    await http().post(`${AUTH}/logout`).set("Authorization", `Bearer ${token}`).expect(204);
    await http().get(`${AUTH}/sessions`).set("Authorization", `Bearer ${token}`).expect(401);
    await http().post(`${AUTH}/refresh`).set("Cookie", cookie).send({}).expect(401);
  });

  it("logout-all ends sessions on every device", async () => {
    const { body, token: first } = await register();
    const second = await http().post(`${AUTH}/login`).send({ login: body.username, password: PASSWORD }).expect(200);

    await http().post(`${AUTH}/logout-all`).set("Authorization", `Bearer ${second.body.accessToken}`).expect(204);
    await http().get(`${AUTH}/sessions`).set("Authorization", `Bearer ${first}`).expect(401);
  });

  it("can end another of your own sessions but not someone else's", async () => {
    const { body, token } = await register();
    const other = await http().post(`${AUTH}/login`).send({ login: body.username, password: PASSWORD }).expect(200);
    const sessions = await http().get(`${AUTH}/sessions`).set("Authorization", `Bearer ${token}`).expect(200);
    const otherSession = sessions.body.find((s: { isCurrent: boolean }) => !s.isCurrent);

    const stranger = await register();
    await http()
      .delete(`${AUTH}/sessions/${otherSession.id}`)
      .set("Authorization", `Bearer ${stranger.token}`)
      .expect(404);

    await http().delete(`${AUTH}/sessions/${otherSession.id}`).set("Authorization", `Bearer ${token}`).expect(204);
    await http().get(`${AUTH}/sessions`).set("Authorization", `Bearer ${other.body.accessToken}`).expect(401);
  });
});

describe("email verification", () => {
  it("verifies with the emailed code and rejects wrong codes", async () => {
    const { body, token } = await register();
    const code = lastCodeFor(body.email);
    const wrong = code === "000000" ? "111111" : "000000";

    const bad = await http()
      .post(`${AUTH}/verify-email`)
      .set("Authorization", `Bearer ${token}`)
      .send({ code: wrong })
      .expect(400);
    expect(bad.body.code).toBe("INVALID_CODE");

    const ok = await http()
      .post(`${AUTH}/verify-email`)
      .set("Authorization", `Bearer ${token}`)
      .send({ code })
      .expect(200);
    expect(ok.body.emailVerified).toBe(true);

    const resend = await http()
      .post(`${AUTH}/verify-email/resend`)
      .set("Authorization", `Bearer ${token}`)
      .expect(409);
    expect(resend.body.code).toBe("EMAIL_ALREADY_VERIFIED");
  });

  it("locks the code after too many wrong attempts", async () => {
    const { body, token } = await register();
    const code = lastCodeFor(body.email);
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) {
      await http().post(`${AUTH}/verify-email`).set("Authorization", `Bearer ${token}`).send({ code: wrong });
    }
    const res = await http()
      .post(`${AUTH}/verify-email`)
      .set("Authorization", `Bearer ${token}`)
      .send({ code })
      .expect(429);
    expect(res.body.code).toBe("TOO_MANY_ATTEMPTS");
  });
});

describe("passwords", () => {
  it("does not reveal whether an email is registered", async () => {
    await http().post(`${AUTH}/password/forgot`).send({ email: "ghost@example.com" }).expect(204);
    expect(mail.outbox).toHaveLength(0);
  });

  it("resets the password with the emailed code and signs out everywhere", async () => {
    const { body, token } = await register();
    await http().post(`${AUTH}/password/forgot`).send({ email: body.email }).expect(204);
    const code = lastCodeFor(body.email);

    await http()
      .post(`${AUTH}/password/reset`)
      .send({ email: body.email, code, newPassword: "NewSecret456" })
      .expect(204);

    await http().get(`${AUTH}/sessions`).set("Authorization", `Bearer ${token}`).expect(401);
    await http().post(`${AUTH}/login`).send({ login: body.username, password: PASSWORD }).expect(401);
    await http().post(`${AUTH}/login`).send({ login: body.username, password: "NewSecret456" }).expect(200);
  });

  it("changes the password, keeping only the current session", async () => {
    const { body, token: current } = await register();
    const other = await http().post(`${AUTH}/login`).send({ login: body.username, password: PASSWORD }).expect(200);

    const wrong = await http()
      .post(`${AUTH}/password/change`)
      .set("Authorization", `Bearer ${current}`)
      .send({ currentPassword: "Nope12345", newPassword: "Changed789" })
      .expect(400);
    expect(wrong.body.code).toBe("INVALID_PASSWORD");

    await http()
      .post(`${AUTH}/password/change`)
      .set("Authorization", `Bearer ${current}`)
      .send({ currentPassword: PASSWORD, newPassword: "Changed789" })
      .expect(204);

    await http().get(`${AUTH}/sessions`).set("Authorization", `Bearer ${current}`).expect(200);
    await http().get(`${AUTH}/sessions`).set("Authorization", `Bearer ${other.body.accessToken}`).expect(401);
  });
});

describe("username availability", () => {
  it("reports taken names with free suggestions", async () => {
    const { body } = await register();
    const res = await http().get(`${AUTH}/username-available`).query({ username: body.username }).expect(200);
    expect(res.body).toMatchObject({ available: false, reason: "TAKEN" });
    expect(res.body.suggestions.length).toBeGreaterThan(0);
    expect(res.body.suggestions).not.toContain(body.username);
  });

  it("reports free and invalid names", async () => {
    const free = await http().get(`${AUTH}/username-available`).query({ username: "totally_free_name" }).expect(200);
    expect(free.body).toEqual({ available: true, suggestions: [] });

    const reserved = await http().get(`${AUTH}/username-available`).query({ username: "reels" }).expect(200);
    expect(reserved.body).toMatchObject({ available: false, reason: "INVALID" });
  });
});
