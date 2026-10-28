import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestApp } from "./create-test-app";

describe("GET /api/v1/health", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("reports the database as up", async () => {
    const res = await request(app.getHttpServer()).get("/api/v1/health").expect(200);
    expect(res.body).toMatchObject({ status: "ok", database: "up" });
  });

  it("returns errors in the unified format", async () => {
    const res = await request(app.getHttpServer()).get("/api/v1/does-not-exist").expect(404);
    expect(res.body).toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
    expect(typeof res.body.message).toBe("string");
  });

  it("echoes a request id for tracing", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/health")
      .set("x-request-id", "test-123");
    expect(res.headers["x-request-id"]).toBe("test-123");
  });
});
