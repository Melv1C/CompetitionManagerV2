import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));

import { isVerified } from "./use-auth";

function createApp(emailVerified: boolean) {
  return new Hono()
    .use("*", async (c, next) => {
      c.set("user", {
        id: "U".repeat(32),
        name: "Organization Member",
        email: "member@example.com",
        emailVerified,
        image: null,
        createdAt: new Date("2026-09-19T00:00:00.000Z"),
        updatedAt: new Date("2026-09-19T00:00:00.000Z"),
        role: "user",
        banned: false,
        banReason: null,
        banExpires: null,
      });
      c.set("session", null);
      await next();
    })
    .use("/organization/*", isVerified)
    .get("/organization/list", (c) => c.json({ organizations: [] }));
}

describe("verified user access", () => {
  it("rejects organization API access from an unverified user", async () => {
    const response = await createApp(false).request("/organization/list");

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Email verification required" });
  });

  it("allows organization API access from a verified user", async () => {
    const response = await createApp(true).request("/organization/list");

    expect(response.status).toBe(200);
  });
});
