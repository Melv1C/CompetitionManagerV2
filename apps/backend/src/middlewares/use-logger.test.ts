import { Hono } from "hono";
import { requestId } from "hono/request-id";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { loggerInfo, loggerLog } = vi.hoisted(() => ({
  loggerInfo: vi.fn(),
  loggerLog: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: loggerInfo,
    log: loggerLog,
  },
}));

import { useLogger } from "./use-logger";

describe("useLogger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the request ID and records a structured completion log", async () => {
    const app = new Hono()
      .use(requestId())
      .use(useLogger)
      .get("/health", (c) => c.json({ status: "ok" }));

    const response = await app.request("/health", {
      headers: { "x-request-id": "request_123" },
    });

    expect(response.headers.get("x-request-id")).toBe("request_123");
    expect(loggerInfo).toHaveBeenCalledWith("Incoming request");
    expect(loggerLog).toHaveBeenCalledWith({
      level: "info",
      message: "Request GET /health completed",
      statusCode: 200,
      durationMs: expect.any(Number),
    });
  });
});
