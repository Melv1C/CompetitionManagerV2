import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApiApp } from "../../src/app";
import { database } from "../../src/infrastructure/database";

const app = createApiApp();

function sessionCookie(response: Response): string {
  const cookie = response.headers.get("set-cookie");
  expect(cookie).toBeTruthy();
  return cookie!.split(";", 1)[0]!;
}

describe("Better Auth session boundary", () => {
  const createdEmails: string[] = [];

  beforeAll(async () => {
    await database.$connect();
  });

  afterAll(async () => {
    await database.user.deleteMany({ where: { email: { in: createdEmails } } });
    await database.$disconnect();
  });

  it("registers, signs in, retrieves, and signs out a session", async () => {
    const email = `auth-${crypto.randomUUID()}@example.test`;
    createdEmails.push(email);

    const registration = await app.request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Auth Test User", email, password: "correct horse battery" }),
    });

    expect(registration.status).toBe(200);
    expect((await registration.json()).user).toMatchObject({ email, emailVerified: false });
    const cookie = sessionCookie(registration);

    const session = await app.request("http://localhost:3000/api/auth/get-session", {
      headers: { cookie },
    });
    expect(session.status).toBe(200);
    expect(await session.json()).toMatchObject({ user: { email, emailVerified: false } });

    const invalidCredentials = await app.request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "not the password" }),
    });
    expect(invalidCredentials.status).toBe(401);

    const signOut = await app.request("http://localhost:3000/api/auth/sign-out", {
      method: "POST",
      headers: { cookie },
    });
    expect(signOut.status).toBe(200);

    const invalidatedSession = await app.request("http://localhost:3000/api/auth/get-session", {
      headers: { cookie },
    });
    expect(invalidatedSession.status).toBe(200);
    expect(await invalidatedSession.json()).toBeNull();

    const signIn = await app.request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "correct horse battery" }),
    });
    expect(signIn.status).toBe(200);
    expect((await signIn.json()).user).toMatchObject({ email, emailVerified: false });

    const anonymousSession = await app.request("http://localhost:3000/api/auth/get-session");
    expect(anonymousSession.status).toBe(200);
    expect(await anonymousSession.json()).toBeNull();
  });
});
