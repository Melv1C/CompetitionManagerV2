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

  it("returns validation details for malformed health requests", async () => {
    const app = createHealthApp({
      database: () => Promise.resolve(true),
      redis: () => Promise.resolve(true),
    });

    const response = await app.request("/api/v1/health/live?unexpected=true");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        fieldErrors: { _root: ['Unrecognized key: "unexpected"'] },
        details: { issues: [{ code: "unrecognized_keys", path: [] }] },
      },
    });
  });

  it("uses the versioned error envelope for unknown routes", async () => {
    const app = createHealthApp({
      database: () => Promise.resolve(true),
      redis: () => Promise.resolve(true),
    });

    const response = await app.request("/api/v1/health/missing");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      error: {
        code: "NOT_FOUND",
        message: "The requested resource was not found",
        details: {},
      },
    });
    expect(body.error.requestId).toBe(response.headers.get("x-request-id"));
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("reports queue depth and terminal failures without payloads", async () => {
    const app = createHealthApp({
      database: () => Promise.resolve(true),
      redis: () => Promise.resolve(true),
      queue: () => Promise.resolve({ available: true, depth: 2, failedJobs: 1 }),
    });

    const response = await app.request("/health/operations");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      service: "backend",
      queue: { available: true, depth: 2, failedJobs: 1 },
    });
  });

  it("does not expose unexpected error details", async () => {
    const app = createHealthApp({
      database: () => Promise.resolve(true),
      redis: () => Promise.resolve(true),
    });
    app.get("/api/v1/test/failure", () => {
      throw new Error("database password=super-secret");
    });

    const response = await app.request("/api/v1/test/failure");
    const body = await response.text();

    expect(response.status).toBe(500);
    expect(JSON.parse(body)).toMatchObject({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
        details: {},
      },
    });
    expect(body).not.toContain("super-secret");
  });
});
