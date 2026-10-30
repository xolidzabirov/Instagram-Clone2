import type { INestApplication } from "@nestjs/common";
import type { FeedItem, Paginated } from "@ig/shared";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaService } from "../src/infra/prisma/prisma.service";
import { createTestApp } from "./create-test-app";
import { resetDatabase } from "./db";
import { publishPost } from "./factories";
import { registerUser } from "./helpers";

const API = "/api/v1";

let app: INestApplication;
let prisma: PrismaService;
type TestUser = Awaited<ReturnType<typeof registerUser>>;

const http = () => request(app.getHttpServer());
const authed = (token: string) => ({ Authorization: `Bearer ${token}` });
const follow = (from: TestUser, to: TestUser) =>
  http().post(`${API}/users/${to.user.id}/follow`).set(authed(from.token)).expect(200);

async function feed(user: TestUser, query: Record<string, unknown> = {}): Promise<Paginated<FeedItem>> {
  const res = await http().get(`${API}/feed`).query(query).set(authed(user.token)).expect(200);
  return res.body;
}

/** Walks every page of a feed */
async function allPages(user: TestUser, query: Record<string, unknown>) {
  const items: FeedItem[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page++) {
    const res = await feed(user, { ...query, ...(cursor && { cursor }) });
    items.push(...res.items);
    if (!res.nextCursor) return items;
    cursor = res.nextCursor;
  }
  throw new Error("feed never ended");
}

/** Waits for async event listeners (topic weights are updated after the response) */
async function eventually<T>(read: () => Promise<T>, check: (value: T) => boolean): Promise<T> {
  for (let i = 0; i < 50; i++) {
    const value = await read();
    if (check(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  return read();
}

async function topicWithHashtag(slug: string, tag: string) {
  const topic = await prisma.topic.create({ data: { slug, nameRu: slug, nameEn: slug } });
  const hashtag = await prisma.hashtag.create({ data: { name: tag } });
  await prisma.hashtagTopic.create({ data: { hashtagId: hashtag.id, topicId: topic.id } });
  return topic;
}

beforeAll(async () => {
  app = await createTestApp();
  prisma = app.get(PrismaService);
});

beforeEach(async () => {
  await resetDatabase(app);
});

afterAll(async () => {
  await app.close();
});

describe("following and favorites", () => {
  it("shows people you follow and yourself, newest first, without muted, private or blocking authors", async () => {
    const [me, alice, bob, muted, stranger, locked, blocker] = await Promise.all(
      Array.from({ length: 7 }, (_, i) => registerUser(app, `f${i}`))
    );
    await follow(me!, alice!);
    await follow(me!, bob!);
    await follow(me!, muted!);
    await http().patch(`${API}/users/${muted!.user.id}/relationship`).set(authed(me!.token)).send({ mutedPosts: true }).expect(200);
    await prisma.user.update({ where: { id: locked!.user.id }, data: { isPrivate: true } });

    const expected: string[] = [];
    for (const author of [alice!, me!, bob!, alice!]) expected.unshift((await publishPost(app, author)).id);
    for (const author of [muted!, stranger!, locked!, blocker!]) await publishPost(app, author);
    await follow(me!, blocker!);
    await http().put(`${API}/users/${me!.user.id}/block`).set(authed(blocker!.token)).expect(204);

    const items = await allPages(me!, { mode: "following", limit: 3 });
    expect(items.map((p) => p.id)).toEqual(expected);
    expect(items.every((p) => !p.isSuggested)).toBe(true);
  });

  it("limits favorites to accounts marked as favorite", async () => {
    const [me, fav, other] = [await registerUser(app), await registerUser(app), await registerUser(app)];
    await follow(me, fav);
    await follow(me, other);
    await http().patch(`${API}/users/${fav.user.id}/relationship`).set(authed(me.token)).send({ isFavorite: true }).expect(200);
    const favPost = await publishPost(app, fav);
    await publishPost(app, other);
    await publishPost(app, me);

    const res = await feed(me, { mode: "favorites" });
    expect(res.items.map((p) => p.id)).toEqual([favPost.id]);
  });
});

describe("home", () => {
  it("puts a suggestion in every fifth slot, then continues with suggestions only", async () => {
    const [me, friend, creator] = [await registerUser(app), await registerUser(app), await registerUser(app)];
    await follow(me, friend);
    const friendPosts: string[] = [];
    for (let i = 0; i < 6; i++) friendPosts.unshift((await publishPost(app, friend)).id);
    const suggestions: string[] = [];
    for (let i = 0; i < 3; i++) suggestions.push((await publishPost(app, creator)).id);

    const first = await feed(me, { limit: 5 });
    expect(first.items.map((p) => p.isSuggested)).toEqual([false, false, false, false, true]);
    expect(first.items.slice(0, 4).map((p) => p.id)).toEqual(friendPosts.slice(0, 4));

    const items = await allPages(me, { limit: 5 });
    const ids = items.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => friendPosts.includes(id))).toEqual(friendPosts);
    expect(new Set(ids.filter((id) => suggestions.includes(id)))).toEqual(new Set(suggestions));
    expect(items.filter((p) => p.isSuggested).map((p) => p.author.id)).toEqual([creator.user.id, creator.user.id, creator.user.id]);
  });

  it("never suggests private, blocked, liked or not-interested posts", async () => {
    const [me, locked, blocker, liked, boring, fine] = await Promise.all(
      Array.from({ length: 6 }, (_, i) => registerUser(app, `h${i}`))
    );
    await prisma.user.update({ where: { id: locked!.user.id }, data: { isPrivate: true } });
    await publishPost(app, locked!);
    await publishPost(app, blocker!);
    await http().put(`${API}/users/${me!.user.id}/block`).set(authed(blocker!.token)).expect(204);
    const likedPost = await publishPost(app, liked!);
    await http().put(`${API}/posts/${likedPost.id}/like`).set(authed(me!.token)).expect(200);
    const boringPost = await publishPost(app, boring!);
    await http().post(`${API}/posts/${boringPost.id}/not-interested`).set(authed(me!.token)).expect(204);
    const finePost = await publishPost(app, fine!);

    const items = await allPages(me!, {});
    expect(items.map((p) => p.id)).toEqual([finePost.id]);
  });

  it("ranks suggestions by the viewer's topics («Ваш алгоритм»)", async () => {
    const [me, cook, coder] = [await registerUser(app), await registerUser(app), await registerUser(app)];
    const food = await topicWithHashtag("food", "foodie");
    await topicWithHashtag("code", "coding");
    const foodPost = await publishPost(app, cook, { caption: "Ужин #foodie" });
    const codePost = await publishPost(app, coder, { caption: "Рефакторинг #coding" });

    // Newest first while weights are neutral and scores equal
    expect((await feed(me)).items.map((p) => p.id)).toEqual([codePost.id, foodPost.id]);

    await http().put(`${API}/topics/me/${food.id}`).set(authed(me.token)).send({ weight: 0.8 }).expect(200);
    expect((await feed(me)).items.map((p) => p.id)).toEqual([foodPost.id, codePost.id]);
  });
});

describe("topics", () => {
  it("learns from likes but never overrides a weight set by hand", async () => {
    const [me, author] = [await registerUser(app), await registerUser(app)];
    const travel = await topicWithHashtag("travel", "travel");
    const pets = await topicWithHashtag("pets", "cats");
    const travelPost = await publishPost(app, author, { caption: "#travel" });
    const petsPost = await publishPost(app, author, { caption: "#cats" });

    await http().put(`${API}/topics/me/${pets.id}`).set(authed(me.token)).send({ weight: -0.5 }).expect(200);
    await http().put(`${API}/posts/${travelPost.id}/like`).set(authed(me.token)).expect(200);
    await http().put(`${API}/posts/${petsPost.id}/like`).set(authed(me.token)).expect(200);

    const mine = await eventually(
      async () => (await http().get(`${API}/topics/me`).set(authed(me.token))).body,
      (body: { topic: { slug: string } }[]) => body.some((t) => t.topic.slug === "travel")
    );
    expect(mine).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ topic: expect.objectContaining({ id: travel.id }), weight: 0.05, source: "AUTO" }),
        expect.objectContaining({ topic: expect.objectContaining({ id: pets.id }), weight: -0.5, source: "MANUAL" }),
      ])
    );

    const reset = await http().delete(`${API}/topics/me/${pets.id}`).set(authed(me.token)).expect(200);
    expect(reset.body.map((t: { topic: { id: string } }) => t.topic.id)).toEqual([travel.id]);
  });

  it("lowers a post's topics when it is marked not interesting", async () => {
    const [me, author] = [await registerUser(app), await registerUser(app)];
    const cars = await topicWithHashtag("cars", "cars");
    const post = await publishPost(app, author, { caption: "#cars" });

    await http().post(`${API}/posts/${post.id}/not-interested`).set(authed(me.token)).expect(204);
    const weight = await prisma.userTopicWeight.findUniqueOrThrow({
      where: { userId_topicId: { userId: me.user.id, topicId: cars.id } },
    });
    expect(weight).toMatchObject({ weight: -0.2, source: "AUTO" });

    const missing = await http()
      .put(`${API}/topics/me/00000000-0000-7000-8000-000000000000`)
      .set(authed(me.token))
      .send({ weight: 1 })
      .expect(404);
    expect(missing.body.code).toBe("TOPIC_NOT_FOUND");
  });
});
