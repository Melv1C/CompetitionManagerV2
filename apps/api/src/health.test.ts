import { describe, expect, it } from "vitest";

import { createHealthApp } from "./health";

describe("API health endpoints", () => {
  it("reports liveness without depending on infrastructure", async () => {
    const app = createHealthApp({
      database: () => Promise.resolve(false),
      redis: () => Promise.resolve(false),
    });

    const response = await app.request("/health/live");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ok" });
  });

  it("reports readiness only when PostgreSQL and Redis are reachable", async () => {
    const app = createHealthApp({
      database: () => Promise.resolve(true),
      redis: () => Promise.resolve(false),
    });

    const response = await app.request("/health/ready");

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      status: "not_ready",
      checks: { database: "ok", redis: "unavailable" },
    });
  });

  it("returns ready when all required dependencies pass", async () => {
    const app = createHealthApp({
      database: () => Promise.resolve(true),
      redis: () => Promise.resolve(true),
    });

    const response = await app.request("/health/ready");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "ready",
      checks: { database: "ok", redis: "ok" },
    });
  });
});
