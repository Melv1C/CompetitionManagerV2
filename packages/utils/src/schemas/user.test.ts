import { describe, expect, it } from "vitest";

import { Session$, User$ } from "./user";

const betterAuthId = "A".repeat(32);

describe("user schemas", () => {
  it("normalizes user defaults and coerced persisted boolean fields", () => {
    const user = User$.parse({
      id: betterAuthId,
      name: " Jane Admin ",
      email: "jane@example.com",
      emailVerified: "true",
      image: null,
      createdAt: "2026-05-29T10:00:00.000Z",
      updatedAt: "2026-05-29T10:05:00.000Z",
    });

    expect(user).toMatchObject({
      id: betterAuthId,
      name: "Jane Admin",
      emailVerified: true,
      role: "user",
    });
    expect(user.createdAt).toEqual(new Date("2026-05-29T10:00:00.000Z"));
  });

  it("rejects invalid email and image values", () => {
    expect(() =>
      User$.parse({
        id: betterAuthId,
        name: "Jane",
        email: "not-an-email",
        emailVerified: true,
        image: "not-a-url",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow();
  });

  it("parses sessions with nullable request metadata", () => {
    expect(
      Session$.parse({
        id: betterAuthId,
        expiresAt: "2026-05-30T10:00:00.000Z",
        token: " token ",
        createdAt: "2026-05-29T10:00:00.000Z",
        updatedAt: "2026-05-29T10:05:00.000Z",
        ipAddress: null,
        userAgent: null,
        userId: betterAuthId,
      }),
    ).toMatchObject({
      token: "token",
      ipAddress: null,
      userId: betterAuthId,
    });
  });
});
