import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaService } from "../src/infra/prisma/prisma.service";
import { createTestApp } from "./create-test-app";
import { resetDatabase } from "./db";
import { registerUser } from "./helpers";

const USERS = "/api/v1/users";

let app: INestApplication;
let prisma: PrismaService;

const http = () => request(app.getHttpServer());
const authed = (token: string) => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  app = await createTestApp();
  prisma = app.get(PrismaService);
  await resetDatabase(app);
});

afterAll(async () => {
  await app.close();
});

describe("GET /users/me", () => {
  it("requires authentication", async () => {
    await http().get(`${USERS}/me`).expect(401);
  });

  it("returns the private account fields", async () => {
    const { token, user } = await registerUser(app);
    const res = await http().get(`${USERS}/me`).set(authed(token)).expect(200);
    expect(res.body).toMatchObject({ id: user.id, email: user.email, emailVerified: false, language: "ru" });
  });
});

describe("PATCH /users/me", () => {
  it("updates only the sent fields and keeps link order", async () => {
    const { token, user } = await registerUser(app);
    const res = await http()
      .patch(`${USERS}/me`)
      .set(authed(token))
      .send({
        bio: "Hello 👋",
        links: [
          { title: "GitHub", url: "https://github.com/example" },
          { title: "Site", url: "https://example.com" },
        ],
      })
      .expect(200);

    expect(res.body).toMatchObject({ bio: "Hello 👋", fullName: user.fullName });
    expect(res.body.links).toEqual([
      { title: "GitHub", url: "https://github.com/example" },
      { title: "Site", url: "https://example.com" },
    ]);
  });

  it("changes the username, lower-cased, unless it is taken", async () => {
    const { token } = await registerUser(app);
    const other = await registerUser(app);

    const ok = await http().patch(`${USERS}/me`).set(authed(token)).send({ username: "New.Name_1" }).expect(200);
    expect(ok.body.username).toBe("new.name_1");

    const taken = await http()
      .patch(`${USERS}/me`)
      .set(authed(token))
      .send({ username: other.user.username })
      .expect(409);
    expect(taken.body.code).toBe("USERNAME_TAKEN");
  });

  it("rejects unknown fields and too many links", async () => {
    const { token } = await registerUser(app);
    await http().patch(`${USERS}/me`).set(authed(token)).send({ role: "ADMIN" }).expect(400);

    const links = Array.from({ length: 6 }, (_, i) => ({ title: `L${i}`, url: `https://example.com/${i}` }));
    const res = await http().patch(`${USERS}/me`).set(authed(token)).send({ links }).expect(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("accepts pending follow requests when the account goes public", async () => {
    const owner = await registerUser(app);
    const fan = await registerUser(app);
    await prisma.user.update({ where: { id: owner.user.id }, data: { isPrivate: true } });
    await prisma.follow.create({
      data: { followerId: fan.user.id, followingId: owner.user.id, status: "PENDING" },
    });

    const res = await http().patch(`${USERS}/me`).set(authed(owner.token)).send({ isPrivate: false }).expect(200);
    expect(res.body.followersCount).toBe(1);

    const follow = await prisma.follow.findUniqueOrThrow({
      where: { followerId_followingId: { followerId: fan.user.id, followingId: owner.user.id } },
    });
    expect(follow.status).toBe("ACCEPTED");
    const fanRow = await prisma.user.findUniqueOrThrow({ where: { id: fan.user.id } });
    expect(fanRow.followingCount).toBe(1);
  });
});

describe("avatar", () => {
  async function createAvatarMedia(ownerId: string) {
    return prisma.media.create({
      data: {
        ownerId,
        type: "IMAGE",
        purpose: "AVATAR",
        status: "READY",
        originalKey: `avatars/${ownerId}/original.jpg`,
        variants: { "320": `avatars/${ownerId}/320.webp`, "150": `avatars/${ownerId}/150.webp` },
        mime: "image/jpeg",
        sizeBytes: 1000,
      },
    });
  }

  it("sets your own processed avatar and resolves its public URL", async () => {
    const { token, user } = await registerUser(app);
    const media = await createAvatarMedia(user.id);

    const res = await http().put(`${USERS}/me/avatar`).set(authed(token)).send({ mediaId: media.id }).expect(200);
    expect(res.body.avatar).toMatch(new RegExp(`/avatars/${user.id}/320\\.webp$`));

    const removed = await http().delete(`${USERS}/me/avatar`).set(authed(token)).expect(200);
    expect(removed.body.avatar).toBeNull();
  });

  it("refuses someone else's media", async () => {
    const { token } = await registerUser(app);
    const other = await registerUser(app);
    const media = await createAvatarMedia(other.user.id);

    const res = await http().put(`${USERS}/me/avatar`).set(authed(token)).send({ mediaId: media.id }).expect(400);
    expect(res.body.code).toBe("INVALID_MEDIA");
  });
});

describe("GET /users/:username", () => {
  it("is visible to guests, case-insensitively", async () => {
    const { user } = await registerUser(app);
    const res = await http().get(`${USERS}/${user.username.toUpperCase()}`).expect(200);
    expect(res.body).toMatchObject({ id: user.id, isMe: false, canViewContent: true, relationship: null });
    expect(res.body.email).toBeUndefined();
  });

  it("knows when you look at your own profile", async () => {
    const { token, user } = await registerUser(app);
    const res = await http().get(`${USERS}/${user.username}`).set(authed(token)).expect(200);
    expect(res.body).toMatchObject({ isMe: true, canViewContent: true, relationship: null });
  });

  it("hides a private account's content until the follow is accepted", async () => {
    const owner = await registerUser(app);
    const viewer = await registerUser(app);
    await prisma.user.update({ where: { id: owner.user.id }, data: { isPrivate: true } });

    const stranger = await http().get(`${USERS}/${owner.user.username}`).set(authed(viewer.token)).expect(200);
    expect(stranger.body.canViewContent).toBe(false);

    await prisma.follow.create({
      data: { followerId: viewer.user.id, followingId: owner.user.id, status: "PENDING" },
    });
    const pending = await http().get(`${USERS}/${owner.user.username}`).set(authed(viewer.token)).expect(200);
    expect(pending.body.relationship).toMatchObject({ followRequested: true, following: false });
    expect(pending.body.canViewContent).toBe(false);

    await prisma.follow.update({
      where: { followerId_followingId: { followerId: viewer.user.id, followingId: owner.user.id } },
      data: { status: "ACCEPTED" },
    });
    const accepted = await http().get(`${USERS}/${owner.user.username}`).set(authed(viewer.token)).expect(200);
    expect(accepted.body.relationship).toMatchObject({ following: true, followRequested: false });
    expect(accepted.body.canViewContent).toBe(true);
  });

  it("does not exist for people the owner blocked, but stays visible to the blocker", async () => {
    const owner = await registerUser(app);
    const blocked = await registerUser(app);
    await prisma.block.create({ data: { blockerId: owner.user.id, blockedId: blocked.user.id } });

    const res = await http().get(`${USERS}/${owner.user.username}`).set(authed(blocked.token)).expect(404);
    expect(res.body.code).toBe("USER_NOT_FOUND");

    const blockerView = await http().get(`${USERS}/${blocked.user.username}`).set(authed(owner.token)).expect(200);
    expect(blockerView.body.relationship.blocking).toBe(true);
    expect(blockerView.body.canViewContent).toBe(false);
  });

  it("returns 404 for unknown and banned users", async () => {
    await http().get(`${USERS}/no_such_user_here`).expect(404);
    const { user } = await registerUser(app);
    await prisma.user.update({ where: { id: user.id }, data: { status: "BANNED" } });
    await http().get(`${USERS}/${user.username}`).expect(404);
  });

  it("treats an invalid token on a public route as a guest", async () => {
    const { user } = await registerUser(app);
    const res = await http().get(`${USERS}/${user.username}`).set(authed("garbage")).expect(200);
    expect(res.body.relationship).toBeNull();
  });
});
