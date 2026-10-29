import type { INestApplication } from "@nestjs/common";
import type { MediaInfo, MediaUpload } from "@ig/shared";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { JobQueue } from "../src/infra/queue/job-queue";
import { PrismaService } from "../src/infra/prisma/prisma.service";
import { MediaCleanup } from "../src/modules/media/media.cleanup";
import { ffmpeg } from "../src/modules/media/ffmpeg";
import { createTestApp } from "./create-test-app";
import { resetDatabase } from "./db";
import { registerUser } from "./helpers";

const API = "/api/v1";

let app: INestApplication;
let work: string;
let owner: Awaited<ReturnType<typeof registerUser>>;

const http = () => request(app.getHttpServer());
const authed = (token: string) => ({ Authorization: `Bearer ${token}` });
/** Upload/media URLs are absolute; supertest needs the path */
const pathOf = (url: string) => new URL(url).pathname;

interface UploadSpec {
  type: "IMAGE" | "VIDEO" | "AUDIO";
  purpose: "POST" | "REEL" | "STORY" | "AVATAR" | "MESSAGE";
  mime: string;
  body: Buffer;
}

async function startUpload(token: string, spec: UploadSpec, sizeBytes = spec.body.length) {
  const res = await http()
    .post(`${API}/media/uploads`)
    .set(authed(token))
    .send({ type: spec.type, purpose: spec.purpose, mime: spec.mime, sizeBytes })
    .expect(201);
  return res.body as MediaUpload;
}

async function uploadAndProcess(token: string, spec: UploadSpec): Promise<MediaInfo> {
  const upload = await startUpload(token, spec);
  await http()
    .put(pathOf(upload.uploadUrl))
    .set(authed(token))
    .set("Content-Type", spec.mime)
    .send(spec.body)
    .expect(204);
  const completed = await http().post(`${API}/media/${upload.mediaId}/complete`).set(authed(token)).expect(202);
  expect(completed.body.status).toBe("PROCESSING");

  await app.get(JobQueue).drain();
  const res = await http().get(`${API}/media/${upload.mediaId}`).set(authed(token)).expect(200);
  return res.body as MediaInfo;
}

async function makeVideo(seconds: number, size = "320x240") {
  const file = join(work, `video-${seconds}s-${size}.mp4`);
  await ffmpeg([
    "-y",
    "-f", "lavfi", "-i", `testsrc=duration=${seconds}:size=${size}:rate=10`,
    "-f", "lavfi", "-i", `sine=frequency=440:duration=${seconds}`,
    "-shortest", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
    file,
  ]);
  return readFile(file);
}

beforeAll(async () => {
  app = await createTestApp();
  await resetDatabase(app);
  work = await mkdtemp(join(tmpdir(), "ig-media-test-"));
  owner = await registerUser(app);
}, 60_000);

afterAll(async () => {
  await app.close();
  await rm(work, { recursive: true, force: true });
});

describe("images", () => {
  it("rotates by EXIF, writes WebP variants with a blurhash and serves them", async () => {
    // A landscape photo taken with the phone rotated: EXIF orientation 6 = 90° clockwise
    const body = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: "#c83232" } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();

    const media = await uploadAndProcess(owner.token, { type: "IMAGE", purpose: "POST", mime: "image/jpeg", body });

    expect(media).toMatchObject({ status: "READY", width: 1200, height: 1600, durationMs: null });
    expect(media.blurhash).toEqual(expect.any(String));
    expect(Object.keys(media.urls).sort()).toEqual(["1080", "320", "640"]);

    const file = await http().get(pathOf(media.urls["1080"]!)).expect(200);
    expect(file.headers["content-type"]).toBe("image/webp");
    expect(file.headers["cross-origin-resource-policy"]).toBe("cross-origin");
    const meta = await sharp(file.body as Buffer).metadata();
    expect(meta).toMatchObject({ width: 1080, height: 1440 });
    // Metadata such as EXIF/GPS is stripped from the published variants
    expect(meta.exif).toBeUndefined();
  });

  it("crops avatars to squares that can be set as the profile picture", async () => {
    const body = await sharp({ create: { width: 800, height: 500, channels: 3, background: "#3264c8" } })
      .png()
      .toBuffer();
    const media = await uploadAndProcess(owner.token, { type: "IMAGE", purpose: "AVATAR", mime: "image/png", body });

    expect(Object.keys(media.urls).sort()).toEqual(["150", "320"]);
    const avatar = await http().get(pathOf(media.urls["150"]!)).expect(200);
    expect(await sharp(avatar.body as Buffer).metadata()).toMatchObject({ width: 150, height: 150 });

    const me = await http().put(`${API}/users/me/avatar`).set(authed(owner.token)).send({ mediaId: media.id }).expect(200);
    expect(me.body.avatar).toBe(media.urls["320"]);
  });

  it("marks files that are not really images as FAILED", async () => {
    const media = await uploadAndProcess(owner.token, {
      type: "IMAGE",
      purpose: "POST",
      mime: "image/jpeg",
      body: Buffer.from("definitely not a jpeg"),
    });
    expect(media.status).toBe("FAILED");
    expect(media.urls).toEqual({});
  });
});

describe("video and audio", () => {
  it("transcodes video to MP4 with a poster", async () => {
    const media = await uploadAndProcess(owner.token, {
      type: "VIDEO",
      purpose: "REEL",
      mime: "video/mp4",
      body: await makeVideo(2),
    });

    expect(media).toMatchObject({ status: "READY", width: 320, height: 240 });
    expect(media.durationMs).toBeGreaterThanOrEqual(1900);
    expect(media.durationMs).toBeLessThanOrEqual(2200);
    expect(Object.keys(media.urls)).toEqual(expect.arrayContaining(["mp4", "poster"]));

    const video = await http().get(pathOf(media.urls.mp4!)).expect(200);
    expect(video.headers["content-type"]).toBe("video/mp4");
  }, 60_000);

  it("rejects videos longer than the limit of their purpose", async () => {
    const media = await uploadAndProcess(owner.token, {
      type: "VIDEO",
      purpose: "STORY",
      mime: "video/mp4",
      body: await makeVideo(62, "64x64"),
    });
    expect(media.status).toBe("FAILED");
  }, 60_000);

  it("converts voice messages to AAC", async () => {
    const wav = join(work, "voice.wav");
    await ffmpeg(["-y", "-f", "lavfi", "-i", "sine=frequency=300:duration=2", wav]);
    const media = await uploadAndProcess(owner.token, {
      type: "AUDIO",
      purpose: "MESSAGE",
      mime: "audio/wav",
      body: await readFile(wav),
    });
    expect(media).toMatchObject({ status: "READY", width: null, height: null });
    expect(Object.keys(media.urls)).toEqual(["audio"]);
  }, 60_000);
});

describe("upload rules", () => {
  const tiny = Buffer.from("x".repeat(100));

  it("validates type, format and size against the purpose", async () => {
    const wrongType = await http()
      .post(`${API}/media/uploads`)
      .set(authed(owner.token))
      .send({ type: "VIDEO", purpose: "AVATAR", mime: "video/mp4", sizeBytes: 1000 })
      .expect(400);
    expect(wrongType.body.details.fields.type).toBeDefined();

    const wrongMime = await http()
      .post(`${API}/media/uploads`)
      .set(authed(owner.token))
      .send({ type: "IMAGE", purpose: "POST", mime: "image/gif", sizeBytes: 1000 })
      .expect(400);
    expect(wrongMime.body.details.fields.mime).toBeDefined();

    const tooBig = await http()
      .post(`${API}/media/uploads`)
      .set(authed(owner.token))
      .send({ type: "IMAGE", purpose: "AVATAR", mime: "image/jpeg", sizeBytes: 11 * 1024 * 1024 })
      .expect(400);
    expect(tooBig.body.details.fields.sizeBytes).toBeDefined();
  });

  it("refuses bodies larger than declared", async () => {
    const upload = await startUpload(owner.token, { type: "IMAGE", purpose: "POST", mime: "image/jpeg", body: tiny }, 10);
    const res = await http()
      .put(pathOf(upload.uploadUrl))
      .set(authed(owner.token))
      .set("Content-Type", "image/jpeg")
      .send(tiny)
      .expect(413);
    expect(res.body.code).toBe("FILE_TOO_LARGE");
  });

  it("requires the file before completing, and keeps media private to its owner", async () => {
    const upload = await startUpload(owner.token, { type: "IMAGE", purpose: "POST", mime: "image/jpeg", body: tiny });

    const early = await http().post(`${API}/media/${upload.mediaId}/complete`).set(authed(owner.token)).expect(409);
    expect(early.body.code).toBe("NOT_UPLOADED");

    const stranger = await registerUser(app);
    await http()
      .put(pathOf(upload.uploadUrl))
      .set(authed(stranger.token))
      .set("Content-Type", "image/jpeg")
      .send(tiny)
      .expect(404);
    await http().get(`${API}/media/${upload.mediaId}`).set(authed(stranger.token)).expect(404);
  });

  it("does not accept a second upload once completed", async () => {
    const body = await sharp({ create: { width: 10, height: 10, channels: 3, background: "#000" } }).jpeg().toBuffer();
    const media = await uploadAndProcess(owner.token, { type: "IMAGE", purpose: "POST", mime: "image/jpeg", body });
    const res = await http()
      .put(`${API}/media/${media.id}/upload`)
      .set(authed(owner.token))
      .set("Content-Type", "image/jpeg")
      .send(body)
      .expect(409);
    expect(res.body.code).toBe("UPLOAD_CLOSED");
  });
});

describe("cleanup", () => {
  it("deletes media never attached within a day, with its files, and keeps attached media", async () => {
    const prisma = app.get(PrismaService);
    const body = await sharp({ create: { width: 20, height: 20, channels: 3, background: "#0f0" } }).jpeg().toBuffer();
    const orphan = await uploadAndProcess(owner.token, { type: "IMAGE", purpose: "POST", mime: "image/jpeg", body });
    const avatar = await uploadAndProcess(owner.token, { type: "IMAGE", purpose: "AVATAR", mime: "image/jpeg", body });
    await http().put(`${API}/users/me/avatar`).set(authed(owner.token)).send({ mediaId: avatar.id }).expect(200);

    const longAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    await prisma.media.updateMany({ where: { id: { in: [orphan.id, avatar.id] } }, data: { createdAt: longAgo } });

    const removed = await app.get(MediaCleanup).run();
    expect(removed).toBeGreaterThanOrEqual(1);
    expect(await prisma.media.findUnique({ where: { id: orphan.id } })).toBeNull();
    expect(await prisma.media.findUnique({ where: { id: avatar.id } })).not.toBeNull();
    await http().get(pathOf(orphan.urls["320"]!)).expect(404);
    await http().get(pathOf(avatar.urls["150"]!)).expect(200);
  });
});
