import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApiApp } from "../../src/app";
import { database } from "../../src/infrastructure/database";
import { capturedVerificationEmails } from "../../src/lib/auth";

const app = createApiApp();

function sessionCookie(response: Response): string {
  const cookie = response.headers.get("set-cookie");
  expect(cookie).toBeTruthy();
  return cookie!.split(";", 1)[0]!;
}

describe("email verification flow", () => {
  const createdEmails: string[] = [];

  beforeAll(async () => {
    await database.$connect();
    capturedVerificationEmails.splice(0);
  });

  afterAll(async () => {
    await database.user.deleteMany({ where: { email: { in: createdEmails } } });
    await database.$disconnect();
  });

  it("sends, verifies, consumes, and gates a user session", async () => {
    const email = `verification-${crypto.randomUUID()}@example.test`;
    createdEmails.push(email);
    const registration = await app.request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Verification User", email, password: "correct horse battery" }),
    });
    expect(registration.status).toBe(200);
    const cookie = sessionCookie(registration);
    const message = capturedVerificationEmails.at(-1);
    expect(message?.to).toBe(email);
    expect(message?.text).not.toContain("token:");

    const denied = await app.request("http://localhost:3000/api/v1/manager", {
      headers: { cookie },
    });
    expect(denied.status).toBe(403);
    expect((await denied.json()).error.code).toBe("EMAIL_NOT_VERIFIED");

    const verified = await app.request(message!.verificationUrl);
    expect(verified.status).toBe(200);
    expect(await verified.json()).toMatchObject({ status: true });

    const reused = await app.request(message!.verificationUrl);
    expect(reused.status).toBe(401);
    expect(await reused.json()).toEqual({ code: "INVALID_TOKEN", message: "Invalid token" });

    const allowed = await app.request("http://localhost:3000/api/v1/manager", {
      headers: { cookie },
    });
    expect(allowed.status).toBe(403);
    expect(await allowed.json()).toMatchObject({ error: { code: "FORBIDDEN" } });
  });

  it("resends only for the signed-in unverified account", async () => {
    const email = `resend-${crypto.randomUUID()}@example.test`;
    createdEmails.push(email);
    const registration = await app.request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Resend User", email, password: "correct horse battery" }),
    });
    const cookie = sessionCookie(registration);
    const before = capturedVerificationEmails.length;
    const resend = await app.request("http://localhost:3000/api/auth/send-verification-email", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ email }),
    });
    expect(resend.status).toBe(200);
    expect(capturedVerificationEmails.length).toBe(before + 1);
    expect(capturedVerificationEmails.at(-1)?.verificationUrl).not.toBe(
      capturedVerificationEmails.at(-2)?.verificationUrl,
    );
  });
});
