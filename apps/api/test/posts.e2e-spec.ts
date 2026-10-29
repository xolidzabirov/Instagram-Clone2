import type { INestApplication } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DomainEvents } from "../src/common/events/events";
import { PrismaService } from "../src/infra/prisma/prisma.service";
import { createTestApp } from "./create-test-app";
import { resetDatabase } from "./db";
import { registerUser } from "./helpers";

const API = "/api/v1";

let app: INestApplication;
let prisma: PrismaService;
type TestUser = Awaited<ReturnType<typeof registerUser>>;

const http = () => request(app.getHttpServer());
const authed = (token: string) => ({ Authorization: `Bearer ${token}` });

/** A processed upload, created directly in the database (processing is covered by media tests) */
async function readyMedia(ownerId: string, kind: "IMAGE" | "VIDEO" = "IMAGE", purpose: "POST" | "REEL" = "POST") {
  const media = await prisma.media.create({
    data: {
      ownerId,
      type: kind,
      purpose,
      status: "READY",
      originalKey: `media/${ownerId}/original`,
      variants:
        kind === "IMAGE"
          ? { "1080": "img/1080.webp", "640": "img/640.webp", "320": "img/320.webp" }
          : { mp4: "vid/video.mp4", poster: "vid/poster-1080.webp", poster640: "vid/poster-640.webp" },
      width: 1080,
      height: 1350,
      blurhash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH",
      durationMs: kind === "VIDEO" ? 5000 : null,
      mime: kind === "IMAGE" ? "image/jpeg" : "video/mp4",
      sizeBytes: 1000,
    },
  });
  return media.id;
}

async function publish(user: TestUser, body: Record<string, unknown> = {}) {
  const mediaIds = (body.mediaIds as string[] | undefined) ?? [await readyMedia(user.user.id)];
  const res = await http()
    .post(`${API}/posts`)
    .set(authed(user.token))
    .send({ caption: "", ...body, mediaIds })
    .expect(201);
  return res.body;
}

const grid = (username: string, tab = "posts", token?: string, query: Record<string, unknown> = {}) => {
  const req = http().get(`${API}/users/${username}/${tab}`).query(query);
  return token ? req.set(authed(token)) : req;
};

const postsCount = async (id: string) => (await prisma.user.findUniqueOrThrow({ where: { id } })).postsCount;
const hashtagCount = async (name: string) =>
  (await prisma.hashtag.findUnique({ where: { name } }))?.postsCount ?? 0;

beforeAll(async () => {
  app = await createTestApp();
  prisma = app.get(PrismaService);
  await resetDatabase(app);
});

afterAll(async () => {
  await app.close();
});

describe("create", () => {
  it("publishes a carousel with caption index, tags, alt texts and location", async () => {
    const [author, friend, tagged] = [await registerUser(app), await registerUser(app), await registerUser(app)];
    const location = await prisma.location.create({ data: { name: "Душанбе", city: "Душанбе", lat: 38.56, lng: 68.79 } });
    const slides = [await readyMedia(author.user.id), await readyMedia(author.user.id, "VIDEO")];

    const events: { name: string; payload: unknown }[] = [];
    const emitter = app.get(EventEmitter2);
    const listen = (name: string) => (payload: unknown) => events.push({ name, payload });
    emitter.on(DomainEvents.UserMentioned, listen("mentioned"));
    emitter.on(DomainEvents.UserTagged, listen("tagged"));

    const post = await publish(author, {
      mediaIds: slides,
      caption: `Горы! #Travel #mountains привет @${friend.user.username}`,
      locationId: location.id,
      tags: [{ mediaId: slides[0], userId: tagged.user.id, x: 0.5, y: 0.4 }],
      altTexts: { [slides[0]!]: "Снежные горы" },
    });

    expect(post).toMatchObject({
      type: "POST",
      author: { id: author.user.id },
      location: { id: location.id, name: "Душанбе" },
      likesCount: 0,
      isPinned: false,
      isLiked: false,
    });
    expect(post.media.map((m: { id: string }) => m.id)).toEqual(slides);
    expect(post.media[0]).toMatchObject({ type: "IMAGE", altText: "Снежные горы" });
    expect(post.media[0].urls["1080"]).toMatch(/\/media-files\/img\/1080\.webp$/);
    expect(post.media[1]).toMatchObject({ type: "VIDEO", durationMs: 5000 });
    expect(post.media[0].tags).toEqual([expect.objectContaining({ user: expect.objectContaining({ id: tagged.user.id }), x: 0.5 })]);

    expect(await postsCount(author.user.id)).toBe(1);
    expect(await hashtagCount("travel")).toBe(1);
    expect(await hashtagCount("mountains")).toBe(1);
    expect((await prisma.location.findUniqueOrThrow({ where: { id: location.id } })).postsCount).toBe(1);

    emitter.removeAllListeners(DomainEvents.UserMentioned);
    emitter.removeAllListeners(DomainEvents.UserTagged);
    expect(events).toEqual(
      expect.arrayContaining([
        { name: "mentioned", payload: expect.objectContaining({ mentionedUserId: friend.user.id, sourceId: post.id }) },
        { name: "tagged", payload: expect.objectContaining({ taggedUserId: tagged.user.id, postId: post.id }) },
      ])
    );
  });

  it("only accepts the author's own processed, unused media of the right kind", async () => {
    const [author, other] = [await registerUser(app), await registerUser(app)];
    const foreign = await readyMedia(other.user.id);
    const pending = await prisma.media.create({
      data: { ownerId: author.user.id, type: "IMAGE", purpose: "POST", originalKey: "x", mime: "image/jpeg", sizeBytes: 1 },
    });

    const res = await http()
      .post(`${API}/posts`)
      .set(authed(author.token))
      .send({ mediaIds: [foreign, pending.id] })
      .expect(400);
    expect(res.body.code).toBe("INVALID_MEDIA");
    expect(res.body.details.mediaIds).toEqual([foreign, pending.id]);

    const used = await readyMedia(author.user.id);
    await publish(author, { mediaIds: [used] });
    await http().post(`${API}/posts`).set(authed(author.token)).send({ mediaIds: [used] }).expect(400);

    const image = await readyMedia(author.user.id);
    await http().post(`${API}/posts`).set(authed(author.token)).send({ type: "REEL", mediaIds: [image] }).expect(400);
  });

  it("publishes a reel as one vertical video", async () => {
    const author = await registerUser(app);
    const video = await readyMedia(author.user.id, "VIDEO", "REEL");
    const reel = await publish(author, { type: "REEL", mediaIds: [video], aspectRatio: "SQUARE" });
    expect(reel).toMatchObject({ type: "REEL", aspectRatio: "VERTICAL_9_16" });
  });

  it("refuses tags outside the post and tags of people with a block", async () => {
    const [author, blocker] = [await registerUser(app), await registerUser(app)];
    await http().put(`${API}/users/${author.user.id}/block`).set(authed(blocker.token)).expect(204);
    const slide = await readyMedia(author.user.id);

    const outside = await http()
      .post(`${API}/posts`)
      .set(authed(author.token))
      .send({ mediaIds: [slide], tags: [{ mediaId: await readyMedia(author.user.id), userId: blocker.user.id, x: 0, y: 0 }] })
      .expect(400);
    expect(outside.body.code).toBe("INVALID_TAG");

    const blocked = await http()
      .post(`${API}/posts`)
      .set(authed(author.token))
      .send({ mediaIds: [slide], tags: [{ mediaId: slide, userId: blocker.user.id, x: 0, y: 0 }] })
      .expect(400);
    expect(blocked.body.code).toBe("TAG_NOT_ALLOWED");
  });
});

describe("visibility", () => {
  it("follows the author's privacy, blocks and archive", async () => {
    const [author, follower, stranger] = [await registerUser(app), await registerUser(app), await registerUser(app)];
    const post = await publish(author);

    await http().get(`${API}/posts/${post.id}`).expect(200);

    await prisma.user.update({ where: { id: author.user.id }, data: { isPrivate: true } });
    await prisma.follow.create({ data: { followerId: follower.user.id, followingId: author.user.id } });
    const privateRes = await http().get(`${API}/posts/${post.id}`).set(authed(stranger.token)).expect(403);
    expect(privateRes.body.code).toBe("PRIVATE_ACCOUNT");
    await http().get(`${API}/posts/${post.id}`).set(authed(follower.token)).expect(200);
    await http().get(`${API}/posts/${post.id}`).expect(403);

    await http().put(`${API}/users/${follower.user.id}/block`).set(authed(author.token)).expect(204);
    await http().get(`${API}/posts/${post.id}`).set(authed(follower.token)).expect(404);

    await http().post(`${API}/posts/${post.id}/archive`).set(authed(author.token)).expect(204);
    await http().get(`${API}/posts/${post.id}`).set(authed(author.token)).expect(200);
    await prisma.user.update({ where: { id: author.user.id }, data: { isPrivate: false } });
    await http().get(`${API}/posts/${post.id}`).set(authed(stranger.token)).expect(404);
  });

  it("hides like counts from everyone but the author when asked", async () => {
    const [author, viewer] = [await registerUser(app), await registerUser(app)];
    const post = await publish(author, { hideLikes: true });
    expect((await http().get(`${API}/posts/${post.id}`).set(authed(viewer.token))).body.likesCount).toBeNull();
    expect((await http().get(`${API}/posts/${post.id}`).set(authed(author.token))).body.likesCount).toBe(0);
  });
});

describe("edit and delete", () => {
  it("re-indexes hashtags and mentions when the caption changes", async () => {
    const [author, friend, stranger] = [await registerUser(app), await registerUser(app), await registerUser(app)];
    const post = await publish(author, { caption: "#sunsetedit #coffeeedit" });
    expect(await hashtagCount("sunsetedit")).toBe(1);

    const mentions: unknown[] = [];
    const emitter = app.get(EventEmitter2);
    const onMention = (payload: unknown) => mentions.push(payload);
    emitter.on(DomainEvents.UserMentioned, onMention);

    const updated = await http()
      .patch(`${API}/posts/${post.id}`)
      .set(authed(author.token))
      .send({ caption: `#coffeeedit #nightedit @${friend.user.username}`, commentsDisabled: true })
      .expect(200);
    // The same mention again must not notify twice
    await http()
      .patch(`${API}/posts/${post.id}`)
      .set(authed(author.token))
      .send({ caption: `#coffeeedit #nightedit @${friend.user.username}!` })
      .expect(200);
    emitter.off(DomainEvents.UserMentioned, onMention);

    expect(updated.body).toMatchObject({ commentsDisabled: true });
    expect(await hashtagCount("sunsetedit")).toBe(0);
    expect(await hashtagCount("coffeeedit")).toBe(1);
    expect(await hashtagCount("nightedit")).toBe(1);
    expect(mentions).toHaveLength(1);

    const res = await http().patch(`${API}/posts/${post.id}`).set(authed(stranger.token)).send({ caption: "x" }).expect(403);
    expect(res.body.code).toBe("NOT_POST_OWNER");
  });

  it("deletes a post and rolls back counters", async () => {
    const author = await registerUser(app);
    const post = await publish(author, { caption: "#deleteme" });
    expect(await postsCount(author.user.id)).toBe(1);

    await http().delete(`${API}/posts/${post.id}`).set(authed(author.token)).expect(204);
    await http().get(`${API}/posts/${post.id}`).set(authed(author.token)).expect(404);
    expect(await postsCount(author.user.id)).toBe(0);
    expect(await hashtagCount("deleteme")).toBe(0);
    expect((await grid(author.user.username).expect(200)).body.items).toEqual([]);
  });
});

describe("profile grid", () => {
  it("puts pinned posts first, paginates the rest and caps pins at three", async () => {
    const author = await registerUser(app);
    const posts = [];
    for (let i = 0; i < 6; i++) posts.push(await publish(author));
    const [p0, p1, p2, p3] = posts;

    await http().post(`${API}/posts/${p1.id}/pin`).set(authed(author.token)).expect(204);
    const first = await grid(author.user.username, "posts", undefined, { limit: 2 }).expect(200);
    expect(first.body.items[0]).toMatchObject({ id: p1.id, isPinned: true });
    expect(first.body.items.slice(1).map((p: { id: string }) => p.id)).toEqual([posts[5].id, posts[4].id]);

    const second = await grid(author.user.username, "posts", undefined, { limit: 2, cursor: first.body.nextCursor }).expect(200);
    expect(second.body.items.map((p: { id: string }) => p.id)).toEqual([p3.id, p2.id]);

    await http().post(`${API}/posts/${p0.id}/pin`).set(authed(author.token)).expect(204);
    await http().post(`${API}/posts/${p2.id}/pin`).set(authed(author.token)).expect(204);
    const tooMany = await http().post(`${API}/posts/${p3.id}/pin`).set(authed(author.token)).expect(409);
    expect(tooMany.body.code).toBe("PIN_LIMIT");
  });

  it("archives posts out of the grid and back", async () => {
    const author = await registerUser(app);
    const post = await publish(author);

    await http().post(`${API}/posts/${post.id}/archive`).set(authed(author.token)).expect(204);
    expect((await grid(author.user.username).expect(200)).body.items).toEqual([]);
    expect(await postsCount(author.user.id)).toBe(0);
    const archived = await http().get(`${API}/posts/archived`).set(authed(author.token)).expect(200);
    expect(archived.body.items.map((p: { id: string }) => p.id)).toEqual([post.id]);

    await http().delete(`${API}/posts/${post.id}/archive`).set(authed(author.token)).expect(204);
    expect((await grid(author.user.username).expect(200)).body.items).toHaveLength(1);
    expect(await postsCount(author.user.id)).toBe(1);
  });

  it("shows reels and tagged posts, respecting the tagger's privacy", async () => {
    const [author, star, privateTagger, viewer] = [
      await registerUser(app),
      await registerUser(app),
      await registerUser(app),
      await registerUser(app),
    ];
    const reel = await publish(author, {
      type: "REEL",
      mediaIds: [await readyMedia(author.user.id, "VIDEO", "REEL")],
    });
    await publish(author);
    const reels = await grid(author.user.username, "reels").expect(200);
    expect(reels.body.items).toEqual([expect.objectContaining({ id: reel.id, isVideo: true, type: "REEL" })]);

    const slide = await readyMedia(author.user.id);
    const publicTag = await publish(author, { mediaIds: [slide], tags: [{ mediaId: slide, userId: star.user.id, x: 0.1, y: 0.1 }] });
    await prisma.user.update({ where: { id: privateTagger.user.id }, data: { isPrivate: true } });
    const hiddenSlide = await readyMedia(privateTagger.user.id);
    await publish(privateTagger, { mediaIds: [hiddenSlide], tags: [{ mediaId: hiddenSlide, userId: star.user.id, x: 0.2, y: 0.2 }] });

    const tagged = await grid(star.user.username, "tagged", viewer.token).expect(200);
    expect(tagged.body.items.map((p: { id: string }) => p.id)).toEqual([publicTag.id]);
    const ownView = await grid(star.user.username, "tagged", star.token).expect(200);
    expect(ownView.body.items.map((p: { id: string }) => p.id)).toEqual([publicTag.id]);
  });

  it("is forbidden for private accounts the viewer does not follow", async () => {
    const [author, viewer] = [await registerUser(app), await registerUser(app)];
    await publish(author);
    await prisma.user.update({ where: { id: author.user.id }, data: { isPrivate: true } });
    const res = await grid(author.user.username, "posts", viewer.token).expect(403);
    expect(res.body.code).toBe("PRIVATE_ACCOUNT");
    expect((await grid(author.user.username, "posts", author.token).expect(200)).body.items).toHaveLength(1);
  });
});
