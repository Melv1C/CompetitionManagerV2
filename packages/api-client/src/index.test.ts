import { describe, expect, it } from "vitest";

import { fetchHealth } from "./index";

describe("fetchHealth", () => {
  it("normalizes the backend URL and validates both responses", async () => {
    const originalFetch = globalThis.fetch;
    const requests: string[] = [];
    const mockedFetch = (input: RequestInfo | URL) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      requests.push(requestUrl);
      const path = new URL(requestUrl).pathname;
      const body = path.endsWith("/live")
        ? { status: "ok", service: "backend", timestamp: new Date().toISOString() }
        : {
            status: "ready",
            service: "backend",
            checks: { database: "ok", redis: "ok" },
            timestamp: new Date().toISOString(),
          };
      return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
    };
    Object.defineProperty(globalThis, "fetch", { configurable: true, value: mockedFetch });

    try {
      await fetchHealth("http://localhost:3000/");
      expect(requests).toEqual([
        "http://localhost:3000/health/live",
        "http://localhost:3000/health/ready",
      ]);
    } finally {
      Object.defineProperty(globalThis, "fetch", { configurable: true, value: originalFetch });
    }
  });
});
