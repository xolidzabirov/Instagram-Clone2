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

const http = () => request(app.getHttpServer());
const authed = (token: string) => ({ Authorization: `Bearer ${token}` });
type TestUser = Awaited<ReturnType<typeof registerUser>>;

const counts = async (id: string) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });
  return { followers: user.followersCount, following: user.followingCount };
};
const follow = (from: TestUser, to: TestUser) =>
  http().post(`${API}/users/${to.user.id}/follow`).set(authed(from.token));
const makePrivate = (user: TestUser) =>
  prisma.user.update({ where: { id: user.user.id }, data: { isPrivate: true } });

beforeAll(async () => {
  app = await createTestApp();
  prisma = app.get(PrismaService);
  await resetDatabase(app);
});

afterAll(async () => {
  await app.close();
});

describe("follow / unfollow", () => {
  it("follows a public account immediately and keeps counters right", async () => {
    const [alice, bob] = [await registerUser(app), await registerUser(app)];
    const events: unknown[] = [];
    app.get(EventEmitter2).once(DomainEvents.UserFollowed, (event) => events.push(event));

    const res = await follow(alice, bob).expect(200);
    expect(res.body).toEqual({ status: "ACCEPTED" });
    expect(await counts(alice.user.id)).toEqual({ followers: 0, following: 1 });
    expect(await counts(bob.user.id)).toEqual({ followers: 1, following: 0 });
    expect(events).toEqual([{ followerId: alice.user.id, followingId: bob.user.id }]);

    // Following twice changes nothing
    await follow(alice, bob).expect(200);
    expect(await counts(bob.user.id)).toEqual({ followers: 1, following: 0 });

    await http().delete(`${API}/users/${bob.user.id}/follow`).set(authed(alice.token)).expect(204);
    expect(await counts(alice.user.id)).toEqual({ followers: 0, following: 0 });
    expect(await counts(bob.user.id)).toEqual({ followers: 0, following: 0 });
  });

  it("rejects following yourself, unknown users and people who blocked you", async () => {
    const [alice, bob] = [await registerUser(app), await registerUser(app)];
    expect((await follow(alice, alice).expect(400)).body.code).toBe("CANNOT_FOLLOW_SELF");
    await http()
      .post(`${API}/users/00000000-0000-7000-8000-000000000000/follow`)
      .set(authed(alice.token))
      .expect(404);

    await http().put(`${API}/users/${alice.user.id}/block`).set(authed(bob.token)).expect(204);
    expect((await follow(alice, bob).expect(404)).body.code).toBe("USER_NOT_FOUND");
    expect((await follow(bob, alice).expect(409)).body.code).toBe("USER_BLOCKED");
  });

  it("lets you remove a follower", async () => {
    const [alice, bob] = [await registerUser(app), await registerUser(app)];
    await follow(alice, bob).expect(200);
    await http().delete(`${API}/users/${alice.user.id}/follower`).set(authed(bob.token)).expect(204);
    expect(await counts(bob.user.id)).toEqual({ followers: 0, following: 0 });
    await http().delete(`${API}/users/${alice.user.id}/follower`).set(authed(bob.token)).expect(404);
  });
});

describe("private accounts", () => {
  it("sends a request that counts only once accepted", async () => {
    const [fan, star] = [await registerUser(app), await registerUser(app)];
    await makePrivate(star);

    expect((await follow(fan, star).expect(200)).body).toEqual({ status: "PENDING" });
    expect(await counts(star.user.id)).toEqual({ followers: 0, following: 0 });

    const requests = await http().get(`${API}/follow-requests`).set(authed(star.token)).expect(200);
    expect(requests.body.items.map((r: { user: { id: string } }) => r.user.id)).toEqual([fan.user.id]);

    await http().post(`${API}/follow-requests/${fan.user.id}/accept`).set(authed(star.token)).expect(204);
    expect(await counts(star.user.id)).toEqual({ followers: 1, following: 0 });
    expect(await counts(fan.user.id)).toEqual({ followers: 0, following: 1 });

    await http().post(`${API}/follow-requests/${fan.user.id}/accept`).set(authed(star.token)).expect(404);
  });

  it("can decline a request, and the requester can cancel one", async () => {
    const [a, b, star] = [await registerUser(app), await registerUser(app), await registerUser(app)];
    await makePrivate(star);
    await follow(a, star).expect(200);
    await follow(b, star).expect(200);

    await http().post(`${API}/follow-requests/${a.user.id}/decline`).set(authed(star.token)).expect(204);
    await http().delete(`${API}/users/${star.user.id}/follow`).set(authed(b.token)).expect(204);

    const requests = await http().get(`${API}/follow-requests`).set(authed(star.token)).expect(200);
    expect(requests.body.items).toEqual([]);
    expect(await counts(star.user.id)).toEqual({ followers: 0, following: 0 });
  });
});

describe("followers / following lists", () => {
  it("paginates with a cursor and supports search", async () => {
    const star = await registerUser(app, "star");
    const fans = [await registerUser(app, "fan"), await registerUser(app, "fan"), await registerUser(app, "zed")];
    for (const fan of fans) await follow(fan, star).expect(200);

    const first = await http()
      .get(`${API}/users/${star.user.username}/followers`)
      .query({ limit: 2 })
      .set(authed(fans[0]!.token))
      .expect(200);
    expect(first.body.items).toHaveLength(2);
    expect(first.body.nextCursor).toEqual(expect.any(String));

    const second = await http()
      .get(`${API}/users/${star.user.username}/followers`)
      .query({ limit: 2, cursor: first.body.nextCursor })
      .set(authed(fans[0]!.token))
      .expect(200);
    expect(second.body.items).toHaveLength(1);
    expect(second.body.nextCursor).toBeNull();

    const ids = [...first.body.items, ...second.body.items].map((u: { id: string }) => u.id);
    expect(new Set(ids)).toEqual(new Set(fans.map((f) => f.user.id)));

    const searched = await http()
      .get(`${API}/users/${star.user.username}/followers`)
      .query({ q: "ZED" })
      .set(authed(fans[0]!.token))
      .expect(200);
    expect(searched.body.items.map((u: { id: string }) => u.id)).toEqual([fans[2]!.user.id]);
  });

  it("marks who the viewer follows and which row is the viewer", async () => {
    const [viewer, star, other] = [await registerUser(app), await registerUser(app), await registerUser(app)];
    await follow(viewer, star).expect(200);
    await follow(other, star).expect(200);
    await follow(viewer, other).expect(200);

    const res = await http().get(`${API}/users/${star.user.username}/followers`).set(authed(viewer.token)).expect(200);
    const byId = Object.fromEntries(res.body.items.map((u: { id: string }) => [u.id, u]));
    expect(byId[viewer.user.id]).toMatchObject({ isMe: true });
    expect(byId[other.user.id]).toMatchObject({ isMe: false, following: true, followRequested: false });
  });

  it("is forbidden for private accounts you do not follow", async () => {
    const [viewer, star] = [await registerUser(app), await registerUser(app)];
    await makePrivate(star);
    const res = await http().get(`${API}/users/${star.user.username}/following`).set(authed(viewer.token)).expect(403);
    expect(res.body.code).toBe("PRIVATE_ACCOUNT");
  });
});

describe("blocking", () => {
  it("removes follows in both directions and hides the blocker", async () => {
    const [alice, bob] = [await registerUser(app), await registerUser(app)];
    await follow(alice, bob).expect(200);
    await follow(bob, alice).expect(200);
    await http().put(`${API}/close-friends/${bob.user.id}`).set(authed(alice.token)).expect(204);

    await http().put(`${API}/users/${bob.user.id}/block`).set(authed(alice.token)).expect(204);

    expect(await counts(alice.user.id)).toEqual({ followers: 0, following: 0 });
    expect(await counts(bob.user.id)).toEqual({ followers: 0, following: 0 });
    expect(await prisma.closeFriend.count({ where: { ownerId: alice.user.id } })).toBe(0);
    await http().get(`${API}/users/${alice.user.username}`).set(authed(bob.token)).expect(404);

    const blocked = await http().get(`${API}/blocked`).set(authed(alice.token)).expect(200);
    expect(blocked.body.items.map((u: { id: string }) => u.id)).toEqual([bob.user.id]);

    await http().delete(`${API}/users/${bob.user.id}/block`).set(authed(alice.token)).expect(204);
    await http().get(`${API}/users/${alice.user.username}`).set(authed(bob.token)).expect(200);
  });

  it("keeps blocked users out of follower lists", async () => {
    const [viewer, star, troll] = [await registerUser(app), await registerUser(app), await registerUser(app)];
    await follow(troll, star).expect(200);
    await http().put(`${API}/users/${troll.user.id}/block`).set(authed(viewer.token)).expect(204);

    const res = await http().get(`${API}/users/${star.user.username}/followers`).set(authed(viewer.token)).expect(200);
    expect(res.body.items).toEqual([]);
  });
});

describe("relationship settings", () => {
  it("requires following before favorites and mutes", async () => {
    const [alice, bob] = [await registerUser(app), await registerUser(app)];
    const res = await http()
      .patch(`${API}/users/${bob.user.id}/relationship`)
      .set(authed(alice.token))
      .send({ isFavorite: true })
      .expect(409);
    expect(res.body.code).toBe("NOT_FOLLOWING");
  });

  it("updates favorites and mutes, listing muted accounts", async () => {
    const [alice, bob] = [await registerUser(app), await registerUser(app)];
    await follow(alice, bob).expect(200);

    const res = await http()
      .patch(`${API}/users/${bob.user.id}/relationship`)
      .set(authed(alice.token))
      .send({ isFavorite: true, mutedStories: true })
      .expect(200);
    expect(res.body).toMatchObject({ following: true, isFavorite: true, mutedStories: true, mutedPosts: false });

    const muted = await http().get(`${API}/muted`).set(authed(alice.token)).expect(200);
    expect(muted.body.items.map((u: { id: string }) => u.id)).toEqual([bob.user.id]);
  });

  it("manages close friends and restricted accounts", async () => {
    const [alice, bob] = [await registerUser(app), await registerUser(app)];

    await http().put(`${API}/close-friends/${alice.user.id}`).set(authed(alice.token)).expect(400);
    await http().put(`${API}/close-friends/${bob.user.id}`).set(authed(alice.token)).expect(204);
    await http().put(`${API}/close-friends/${bob.user.id}`).set(authed(alice.token)).expect(204);
    const friends = await http().get(`${API}/close-friends`).set(authed(alice.token)).expect(200);
    expect(friends.body.items.map((u: { id: string }) => u.id)).toEqual([bob.user.id]);

    const profile = await http().get(`${API}/users/${bob.user.username}`).set(authed(alice.token)).expect(200);
    expect(profile.body.relationship.isCloseFriend).toBe(true);

    await http().delete(`${API}/close-friends/${bob.user.id}`).set(authed(alice.token)).expect(204);
    expect((await http().get(`${API}/close-friends`).set(authed(alice.token))).body.items).toEqual([]);

    await http().put(`${API}/users/${bob.user.id}/restrict`).set(authed(alice.token)).expect(204);
    const restricted = await http().get(`${API}/restricted`).set(authed(alice.token)).expect(200);
    expect(restricted.body.items.map((u: { id: string }) => u.id)).toEqual([bob.user.id]);
    await http().delete(`${API}/users/${bob.user.id}/restrict`).set(authed(alice.token)).expect(204);
  });
});

describe("suggestions", () => {
  it("ranks friends of friends first and excludes people you follow or blocked", async () => {
    await resetDatabase(app);
    const [me, friend, friendOfFriend, followed, blocked, popular] = await Promise.all(
      Array.from({ length: 6 }, (_, i) => registerUser(app, `s${i}`))
    );
    await follow(me!, friend!).expect(200);
    await follow(me!, followed!).expect(200);
    await follow(friend!, friendOfFriend!).expect(200);
    await follow(followed!, friendOfFriend!).expect(200);
    await http().put(`${API}/users/${blocked!.user.id}/block`).set(authed(me!.token)).expect(204);
    await prisma.user.update({ where: { id: popular!.user.id }, data: { followersCount: 1000 } });

    const res = await http().get(`${API}/users/suggestions`).set(authed(me!.token)).expect(200);
    const ids = res.body.map((u: { id: string }) => u.id);

    expect(res.body[0]).toMatchObject({ id: friendOfFriend!.user.id, mutualCount: 2 });
    expect(ids[1]).toBe(popular!.user.id);
    expect(ids).not.toContain(me!.user.id);
    expect(ids).not.toContain(friend!.user.id);
    expect(ids).not.toContain(followed!.user.id);
    expect(ids).not.toContain(blocked!.user.id);
  });
});
