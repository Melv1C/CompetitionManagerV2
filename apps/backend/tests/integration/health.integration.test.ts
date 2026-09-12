import { describe, expect, it } from "vitest";

import { createHealthApp } from "../../src/health.js";

describe("health HTTP contract", () => {
  it("serves a dependency-backed readiness response through the application boundary", async () => {
    const app = createHealthApp({
      database: () => Promise.resolve(true),
      redis: () => Promise.resolve(true),
    });

    const response = await app.request("/health/ready");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        status: "ready",
        service: "backend",
        checks: { database: "ok", redis: "ok" },
      }),
    );
  });
});
