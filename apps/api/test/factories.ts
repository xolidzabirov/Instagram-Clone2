import type { INestApplication } from "@nestjs/common";
import type { Post } from "@ig/shared";
import request from "supertest";
import { PrismaService } from "../src/infra/prisma/prisma.service";

type TestUser = { token: string; user: { id: string } };

/** A processed upload, created directly in the database (processing is covered by media tests) */
export async function readyMedia(
  app: INestApplication,
  ownerId: string,
  kind: "IMAGE" | "VIDEO" = "IMAGE",
  purpose: "POST" | "REEL" = "POST"
): Promise<string> {
  const media = await app.get(PrismaService).media.create({
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

/** Publishes a post through the API (one image unless mediaIds are given) */
export async function publishPost(
  app: INestApplication,
  author: TestUser,
  body: Record<string, unknown> = {}
): Promise<Post> {
  const mediaIds = (body.mediaIds as string[] | undefined) ?? [await readyMedia(app, author.user.id)];
  const res = await request(app.getHttpServer())
    .post("/api/v1/posts")
    .set("Authorization", `Bearer ${author.token}`)
    .send({ caption: "", ...body, mediaIds })
    .expect(201);
  return res.body as Post;
}
