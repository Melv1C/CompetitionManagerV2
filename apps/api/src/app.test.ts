import { describe, expect, it } from "vitest";

import { createApiApp } from "./app";

describe("API application boundary", () => {
  it("mounts Better Auth under the shared auth path with credentialed CORS", async () => {
    const app = createApiApp({
      authHandler: async (request) =>
        new Response(JSON.stringify({ path: new URL(request.url).pathname }), {
          headers: { "Content-Type": "application/json" },
        }),
    });

    const response = await app.request("http://localhost:3000/api/auth/get-session", {
      headers: { Origin: "http://localhost:3001" },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ path: "/api/auth/get-session" });
    expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:3001");
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
  });

  it("uses deployed surface origins and omits CORS access for an untrusted origin", async () => {
    const originalFrontendUrl = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = "https://frontend.example.test";
    const app = createApiApp({
      authHandler: async () => new Response(JSON.stringify({ ok: true })),
    });

    try {
      const allowed = await app.request("http://localhost:3000/api/auth/get-session", {
        headers: { Origin: "https://frontend.example.test" },
      });
      expect(allowed.headers.get("access-control-allow-origin")).toBe(
        "https://frontend.example.test",
      );

      const rejected = await app.request("http://localhost:3000/api/auth/get-session", {
        headers: { Origin: "https://attacker.example.test" },
      });
      expect(rejected.headers.get("access-control-allow-origin")).toBeNull();
    } finally {
      if (originalFrontendUrl === undefined) delete process.env.FRONTEND_URL;
      else process.env.FRONTEND_URL = originalFrontendUrl;
    }
  });

  it("does not mount inherited organization or admin runtime endpoints", async () => {
    const app = createApiApp({
      authHandler: async () => new Response(JSON.stringify({ reached: true })),
    });

    for (const path of ["/api/auth/organization/invite-member", "/api/auth/admin/list-users"]) {
      const response = await app.request(`http://localhost:3000${path}`, { method: "POST" });
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        error: { code: "NOT_FOUND" },
      });
    }
  });
});
