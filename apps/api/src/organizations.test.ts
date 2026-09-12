import { describe, expect, it } from "vitest";

import { createApiApp } from "./app";
import type { OrganizationService } from "./modules/organizations/service";

const organizationResult = {
  organization: {
    id: "organization-1",
    name: "Brussels Athletics Organization",
    slug: "brussels-athletics-organization",
    createdAt: "2026-09-12T20:00:00.000Z",
    updatedAt: "2026-09-12T20:00:00.000Z",
  },
  membership: {
    id: "membership-1",
    organizationId: "organization-1",
    userId: "owner-1",
    role: "owner" as const,
    createdAt: "2026-09-12T20:00:00.000Z",
  },
};

function serviceForTest(): OrganizationService {
  return {
    listEligibleUsers: async () => ({
      users: [{ id: "owner-1", name: "Owner", email: "owner@example.test", emailVerified: true }],
    }),
    listForUser: async () => ({ organizations: [organizationResult] }),
    getForUser: async () => organizationResult,
    createForAdmin: async () => organizationResult,
  };
}

describe("Organization API authorization boundary", () => {
  it("derives admin authorization from the authenticated session and keeps manager access session-scoped", async () => {
    const service = serviceForTest();
    const adminApp = createApiApp({
      organizationService: service,
      sessionResolver: async () =>
        ({ user: { id: "admin-1", emailVerified: true, role: "admin" } }) as never,
    });
    const ownerApp = createApiApp({
      organizationService: service,
      sessionResolver: async () =>
        ({ user: { id: "owner-1", emailVerified: true, role: "member" } }) as never,
    });

    const users = await adminApp.request("http://localhost:3000/api/v1/admin/users?query=owner");
    expect(users.status).toBe(200);
    expect(await users.json()).toMatchObject({ users: [{ id: "owner-1" }] });

    const created = await adminApp.request("http://localhost:3000/api/v1/admin/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": "stable-key" },
      body: JSON.stringify({
        name: "Brussels Athletics Organization",
        slug: "brussels-athletics-organization",
        ownerUserId: "owner-1",
      }),
    });
    expect(created.status).toBe(201);

    const manager = await ownerApp.request(
      "http://localhost:3000/api/v1/manager/organizations/organization-1",
    );
    expect(manager.status).toBe(200);
    expect(await manager.json()).toEqual(organizationResult);
  });

  it("denies unverified and non-admin callers before the admin service is reached", async () => {
    const service = serviceForTest();
    const calls = { users: 0 };
    service.listEligibleUsers = async () => {
      calls.users += 1;
      return { users: [] };
    };
    const unverified = createApiApp({
      organizationService: service,
      sessionResolver: async () =>
        ({ user: { id: "admin-1", emailVerified: false, role: "admin" } }) as never,
    });
    const nonAdmin = createApiApp({
      organizationService: service,
      sessionResolver: async () =>
        ({ user: { id: "user-1", emailVerified: true, role: "member" } }) as never,
    });

    expect((await unverified.request("http://localhost:3000/api/v1/admin/users")).status).toBe(403);
    expect((await nonAdmin.request("http://localhost:3000/api/v1/admin/users")).status).toBe(403);
    expect(calls.users).toBe(0);
  });

  it("denies the manager entry point when the verified user owns no Organization", async () => {
    const service = serviceForTest();
    service.listForUser = async () => ({ organizations: [] });
    const app = createApiApp({
      organizationService: service,
      sessionResolver: async () =>
        ({ user: { id: "non-owner-1", emailVerified: true, role: "member" } }) as never,
    });

    const response = await app.request("http://localhost:3000/api/v1/manager");

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: "FORBIDDEN" } });
  });
});
