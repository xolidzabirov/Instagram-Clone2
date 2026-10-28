import type { INestApplication } from "@nestjs/common";
import type { AuthResponse } from "@ig/shared";
import request from "supertest";

export const TEST_PASSWORD = "Secret123";

let counter = 0;

/** Registers a fresh user and returns their access token and profile */
export async function registerUser(app: INestApplication, prefix = "user") {
  counter += 1;
  const username = `${prefix}_${Date.now().toString(36)}_${counter}`.slice(0, 30);
  const res = await request(app.getHttpServer())
    .post("/api/v1/auth/register")
    .send({ email: `${username}@example.com`, fullName: `${prefix} ${counter}`, username, password: TEST_PASSWORD })
    .expect(201);
  const body = res.body as AuthResponse;
  return { token: body.accessToken, user: body.user };
}
