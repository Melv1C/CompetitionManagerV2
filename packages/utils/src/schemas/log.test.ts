import { describe, expect, it } from "vitest";

import { LogContext$, LogData$, LogLevel$, Method$ } from "./log";

describe("log schemas", () => {
  it("accepts any HTTP method string", () => {
    expect(Method$.parse("PATCH")).toBe("PATCH");
    expect(Method$.parse("  HEAD  ")).toBe("HEAD");
  });

  it("parses log context and trims path", () => {
    const context = LogContext$.parse({
      requestId: "req_123",
      method: "GET",
      path: "  /api/health  ",
      userId: null,
    });

    expect(context).toEqual({
      requestId: "req_123",
      method: "GET",
      path: "/api/health",
      userId: null,
    });
  });

  it("parses log data with optional metadata and status", () => {
    const data = LogData$.parse({
      requestId: "req_123",
      method: "POST",
      path: "/api/users",
      statusCode: 201,
      durationMs: 12,
      metadata: { source: "test" },
    });

    expect(data.statusCode).toBe(201);
    expect(data.durationMs).toBe(12);
    expect(data.metadata).toEqual({ source: "test" });
  });

  it("keeps known log levels", () => {
    expect(LogLevel$.options).toEqual(["debug", "info", "warn", "error"]);
  });
});
