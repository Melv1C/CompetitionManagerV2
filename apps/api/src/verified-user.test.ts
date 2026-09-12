import { describe, expect, it } from "vitest";

import { createApiApp } from "./app";

describe("verified-user sensitive action guard", () => {
  it("returns the stable denial contract without invoking protected actions", async () => {
    const app = createApiApp({ sessionResolver: async () => null });
    const anonymous = await app.request("http://localhost:3000/api/v1/manager");
    expect(anonymous.status).toBe(401);
    expect(await anonymous.json()).toMatchObject({
      error: { code: "UNAUTHORIZED", message: "Authentication is required" },
    });

    const unverifiedApp = createApiApp({
      sessionResolver: async () =>
        ({ user: { id: "user-1", email: "user@example.test", emailVerified: false } }) as never,
    });
    const unverified = await unverifiedApp.request("http://localhost:3000/api/v1/registrations", {
      method: "POST",
      headers: { "x-email-verified": "true" },
    });
    expect(unverified.status).toBe(403);
    expect(await unverified.json()).toMatchObject({
      error: {
        code: "EMAIL_NOT_VERIFIED",
        message: "Email verification is required for this action",
      },
    });
  });

  it.each([
    ["/api/v1/manager", "GET"],
    ["/api/v1/registrations", "POST"],
    ["/api/v1/payments", "POST"],
    ["/api/v1/organizations/invitations/accept", "POST"],
  ] as const)("allows verified access to %s", async (path, method) => {
    const dependencies = {
      sessionResolver: async () =>
        ({ user: { id: "user-1", email: "user@example.test", emailVerified: true } }) as never,
    };
    const app = createApiApp(
      path === "/api/v1/manager"
        ? {
            ...dependencies,
            organizationService: { listForUser: async () => ({ organizations: [{}] }) } as never,
          }
        : dependencies,
    );
    const response = await app.request(`http://localhost:3000${path}`, { method });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ready" });
  });
});
