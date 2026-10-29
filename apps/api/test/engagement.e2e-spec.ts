import type { INestApplication } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DomainEvents } from "../src/common/events/events";
import { PrismaService } from "../src/infra/prisma/prisma.service";
import { createTestApp } from "./create-test-app";
import { resetDatabase } from "./db";
import { publishPost } from "./factories";
import { registerUser } from "./helpers";

const API = "/api/v1";

let app: INestApplication;
let prisma: PrismaService;

const http = () => request(app.getHttpServer());
const authed = (token: string) => ({ Authorization: `Bearer ${token}` });
const counters = (postId: string) =>
  prisma.post.findUniqueOrThrow({
    where: { id: postId },
    select: { likesCount: true, savesCount: true, repostsCount: true },
  });
const ids = (body: { items: { id: string }[] }) => body.items.map((item) => item.id);

beforeAll(async () => {
  app = await createTestApp();
  prisma = app.get(PrismaService);
  await resetDatabase(app);
});

afterAll(async () => {
  await app.close();
});

describe("likes", () => {
  it("is idempotent, keeps the counter right and notifies once", async () => {
    const [author, fan] = [await registerUser(app), await registerUser(app)];
    const post = await publishPost(app, author);
    const events: unknown[] = [];
    const emitter = app.get(EventEmitter2);
    const onLike = (event: unknown) => events.push(event);
    emitter.on(DomainEvents.PostLiked, onLike);

    const first = await http().put(`${API}/posts/${post.id}/like`).set(authed(fan.token)).expect(200);
    await http().put(`${API}/posts/${post.id}/like`).set(authed(fan.token)).expect(200);
    // Liking your own post never notifies
    await http().put(`${API}/posts/${post.id}/like`).set(authed(author.token)).expect(200);
    emitter.off(DomainEvents.PostLiked, onLike);

    expect(first.body).toEqual({ liked: true, likesCount: 1 });
    expect((await counters(post.id)).likesCount).toBe(2);
    expect(events).toEqual([{ postId: post.id, authorId: author.user.id, userId: fan.user.id }]);

    const viewed = await http().get(`${API}/posts/${post.id}`).set(authed(fan.token)).expect(200);
    expect(viewed.body.isLiked).toBe(true);

    const unliked = await http().delete(`${API}/posts/${post.id}/like`).set(authed(fan.token)).expect(200);
    await http().delete(`${API}/posts/${post.id}/like`).set(authed(fan.token)).expect(200);
    expect(unliked.body).toEqual({ liked: false, likesCount: 1 });
  });

  it("respects hidden like counts and post visibility", async () => {
    const [author, fan, stranger] = [await registerUser(app), await registerUser(app), await registerUser(app)];
    const hidden = await publishPost(app, author, { hideLikes: true });
    const res = await http().put(`${API}/posts/${hidden.id}/like`).set(authed(fan.token)).expect(200);
    expect(res.body).toEqual({ liked: true, likesCount: null });

    await prisma.user.update({ where: { id: author.user.id }, data: { isPrivate: true } });
    const privateRes = await http().put(`${API}/posts/${hidden.id}/like`).set(authed(stranger.token)).expect(403);
    expect(privateRes.body.code).toBe("PRIVATE_ACCOUNT");
  });

  it("lists likers with follow flags, without people blocked by the viewer", async () => {
    const [author, viewer, friend, troll] = [
      await registerUser(app),
      await registerUser(app),
      await registerUser(app),
      await registerUser(app),
    ];
    const post = await publishPost(app, author);
    for (const user of [friend, troll, viewer]) {
      await http().put(`${API}/posts/${post.id}/like`).set(authed(user.token)).expect(200);
    }
    await http().post(`${API}/users/${friend.user.id}/follow`).set(authed(viewer.token)).expect(200);
    await http().put(`${API}/users/${troll.user.id}/block`).set(authed(viewer.token)).expect(204);

    const res = await http().get(`${API}/posts/${post.id}/likes`).set(authed(viewer.token)).expect(200);
    expect(ids(res.body)).toEqual([viewer.user.id, friend.user.id]);
    expect(res.body.items[0]).toMatchObject({ isMe: true });
    expect(res.body.items[1]).toMatchObject({ following: true });
  });
});

describe("saves and collections", () => {
  it("saves into collections, moves between them and keeps posts when a collection is deleted", async () => {
    const [author, me] = [await registerUser(app), await registerUser(app)];
    const [first, second] = [await publishPost(app, author), await publishPost(app, author)];

    const travel = await http().post(`${API}/collections`).set(authed(me.token)).send({ name: "Путешествия" }).expect(201);
    const dup = await http().post(`${API}/collections`).set(authed(me.token)).send({ name: "путешествия" }).expect(409);
    expect(dup.body.code).toBe("COLLECTION_EXISTS");

    await http().put(`${API}/posts/${first.id}/save`).set(authed(me.token)).send({}).expect(200);
    const moved = await http()
      .put(`${API}/posts/${second.id}/save`)
      .set(authed(me.token))
      .send({ collectionId: travel.body.id })
      .expect(200);
    expect(moved.body).toEqual({ saved: true, collectionId: travel.body.id });
    expect((await counters(second.id)).savesCount).toBe(1);

    const all = await http().get(`${API}/users/me/saved`).set(authed(me.token)).expect(200);
    expect(ids(all.body)).toEqual([second.id, first.id]);
    const inTravel = await http().get(`${API}/users/me/saved`).query({ collectionId: travel.body.id }).set(authed(me.token)).expect(200);
    expect(ids(inTravel.body)).toEqual([second.id]);

    const collections = await http().get(`${API}/collections`).set(authed(me.token)).expect(200);
    expect(collections.body).toEqual([expect.objectContaining({ name: "Путешествия", postsCount: 1, cover: expect.any(String) })]);

    await http().delete(`${API}/collections/${travel.body.id}`).set(authed(me.token)).expect(204);
    const afterDelete = await http().get(`${API}/users/me/saved`).set(authed(me.token)).expect(200);
    expect(ids(afterDelete.body)).toEqual([second.id, first.id]);

    await http().delete(`${API}/posts/${first.id}/save`).set(authed(me.token)).expect(204);
    expect((await counters(first.id)).savesCount).toBe(0);
  });

  it("refuses other people's collections and hides saved posts that became invisible", async () => {
    const [author, me, other] = [await registerUser(app), await registerUser(app), await registerUser(app)];
    const theirs = await http().post(`${API}/collections`).set(authed(other.token)).send({ name: "Mine" }).expect(201);
    const post = await publishPost(app, author);

    const res = await http()
      .put(`${API}/posts/${post.id}/save`)
      .set(authed(me.token))
      .send({ collectionId: theirs.body.id })
      .expect(404);
    expect(res.body.code).toBe("COLLECTION_NOT_FOUND");

    await http().put(`${API}/posts/${post.id}/save`).set(authed(me.token)).send({}).expect(200);
    await http().put(`${API}/users/${me.user.id}/block`).set(authed(author.token)).expect(204);
    const saved = await http().get(`${API}/users/me/saved`).set(authed(me.token)).expect(200);
    expect(saved.body.items).toEqual([]);
  });
});

describe("reposts", () => {
  it("reposts public posts of others to the reposts tab", async () => {
    const [author, fan] = [await registerUser(app), await registerUser(app)];
    const post = await publishPost(app, author);

    const own = await http().put(`${API}/posts/${post.id}/repost`).set(authed(author.token)).expect(400);
    expect(own.body.code).toBe("CANNOT_REPOST_OWN");

    await http().put(`${API}/posts/${post.id}/repost`).set(authed(fan.token)).expect(204);
    await http().put(`${API}/posts/${post.id}/repost`).set(authed(fan.token)).expect(204);
    expect((await counters(post.id)).repostsCount).toBe(1);

    const tab = await http().get(`${API}/users/${fan.user.username}/reposts`).expect(200);
    expect(ids(tab.body)).toEqual([post.id]);
    expect((await http().get(`${API}/posts/${post.id}`).set(authed(fan.token))).body.isReposted).toBe(true);

    await http().delete(`${API}/posts/${post.id}/repost`).set(authed(fan.token)).expect(204);
    expect((await counters(post.id)).repostsCount).toBe(0);
    expect((await http().get(`${API}/users/${fan.user.username}/reposts`)).body.items).toEqual([]);
  });

  it("does not allow reposting private accounts' posts", async () => {
    const [author, follower] = [await registerUser(app), await registerUser(app)];
    const post = await publishPost(app, author);
    await prisma.user.update({ where: { id: author.user.id }, data: { isPrivate: true } });
    await prisma.follow.create({ data: { followerId: follower.user.id, followingId: author.user.id } });

    const res = await http().put(`${API}/posts/${post.id}/repost`).set(authed(follower.token)).expect(403);
    expect(res.body.code).toBe("CANNOT_REPOST_PRIVATE");
  });
});
