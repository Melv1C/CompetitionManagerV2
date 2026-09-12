import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApiApp } from "../../src/app";
import { database } from "../../src/infrastructure/database";

type TestUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  role?: string;
};

function appFor(user: TestUser | null) {
  return createApiApp({
    sessionResolver: async () => (user ? ({ user: { ...user } } as never) : null),
  });
}

describe("Organization creation and manager access API", () => {
  const users: TestUser[] = [];
  const organizations: string[] = [];

  beforeAll(async () => {
    await database.$connect();
    for (const [name, emailVerified, role] of [
      ["Platform Admin", true, "admin"],
      ["Organization Owner", true, undefined],
      ["Other User", true, undefined],
      ["Unverified Admin", false, "admin"],
      ["Verified User", true, undefined],
    ] as const) {
      const email = `organizations-${crypto.randomUUID()}@example.test`;
      const created = await database.user.create({
        data: { name, email, emailVerified, ...(role ? { role } : {}) },
      });
      users.push({ id: created.id, email, emailVerified, ...(role ? { role } : {}) });
    }
  });

  afterAll(async () => {
    await database.organization.deleteMany({ where: { id: { in: organizations } } });
    await database.user.deleteMany({ where: { id: { in: users.map(({ id }) => id) } } });
    await database.$disconnect();
  });

  it("allows only a verified platform admin to search eligible owners and create Organizations", async () => {
    const anonymous = await appFor(null).request(
      "http://localhost:3000/api/v1/admin/users?query=org",
    );
    expect(anonymous.status).toBe(401);

    const unverifiedAdmin = await appFor(users[3]!).request(
      "http://localhost:3000/api/v1/admin/users?query=org",
    );
    expect(unverifiedAdmin.status).toBe(403);
    expect(await unverifiedAdmin.json()).toMatchObject({
      error: { code: "EMAIL_NOT_VERIFIED" },
    });

    const nonAdmin = await appFor(users[1]!).request(
      "http://localhost:3000/api/v1/admin/users?query=org",
    );
    expect(nonAdmin.status).toBe(403);
    expect(await nonAdmin.json()).toMatchObject({ error: { code: "FORBIDDEN" } });

    const usersResponse = await appFor(users[0]!).request(
      `/api/v1/admin/users?query=${encodeURIComponent(users[1]!.email)}`,
    );
    expect(usersResponse.status).toBe(200);
    expect(await usersResponse.json()).toEqual({
      users: [
        {
          id: users[1]!.id,
          name: "Organization Owner",
          email: users[1]!.email,
          emailVerified: true,
        },
      ],
    });
  });

  it("rejects invalid owner input and creates the Organization with one owner atomically", async () => {
    const invalid = await appFor(users[0]!).request(
      "http://localhost:3000/api/v1/admin/organizations",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": "invalid-owner" },
        body: JSON.stringify({
          name: "Example Organization",
          slug: "example-organization",
          ownerUserId: "missing",
        }),
      },
    );
    expect(invalid.status).toBe(404);
    expect(await invalid.json()).toMatchObject({ error: { code: "OWNER_NOT_FOUND" } });

    const key = `create-${crypto.randomUUID()}`;
    const response = await appFor(users[0]!).request(
      "http://localhost:3000/api/v1/admin/organizations",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify({
          name: "Brussels Athletics Organization",
          slug: "brussels-athletics-organization",
          ownerUserId: users[1]!.id,
        }),
      },
    );
    expect(response.status).toBe(201);
    const result = await response.json();
    organizations.push(result.organization.id);
    expect(result).toMatchObject({
      organization: {
        name: "Brussels Athletics Organization",
        slug: "brussels-athletics-organization",
      },
      membership: { userId: users[1]!.id, role: "owner" },
    });
    await expect(
      database.member.count({ where: { organizationId: result.organization.id } }),
    ).resolves.toBe(1);
  });

  it("returns the same result for a safe retry and rejects changed idempotency input", async () => {
    const key = `retry-${crypto.randomUUID()}`;
    const body = {
      name: "Retry Safe Organization",
      slug: "retry-safe-organization",
      ownerUserId: users[1]!.id,
    };
    const first = await appFor(users[0]!).request(
      "http://localhost:3000/api/v1/admin/organizations",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify(body),
      },
    );
    const firstResult = await first.json();
    organizations.push(firstResult.organization.id);

    const retry = await appFor(users[0]!).request(
      "http://localhost:3000/api/v1/admin/organizations",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify(body),
      },
    );
    expect(retry.status).toBe(201);
    expect(await retry.json()).toEqual(firstResult);
    await expect(
      database.member.count({ where: { organizationId: firstResult.organization.id } }),
    ).resolves.toBe(1);

    const changed = await appFor(users[0]!).request(
      "http://localhost:3000/api/v1/admin/organizations",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify({ ...body, name: "Changed Organization" }),
      },
    );
    expect(changed.status).toBe(409);
    expect(await changed.json()).toMatchObject({ error: { code: "IDEMPOTENCY_KEY_REUSED" } });
  });

  it("loads only membership-scoped Organizations and denies non-members", async () => {
    const ownerList = await appFor(users[1]!).request(
      "http://localhost:3000/api/v1/manager/organizations",
    );
    const ownerResult = await ownerList.json();
    expect(ownerResult.organizations).toHaveLength(2);
    const organizationId = ownerResult.organizations[0].organization.id as string;
    const ownerOrganization = await appFor(users[1]!).request(
      `http://localhost:3000/api/v1/manager/organizations/${organizationId}`,
    );
    expect(ownerOrganization.status).toBe(200);
    expect(await ownerOrganization.json()).toMatchObject({
      organization: { id: organizationId },
      membership: { userId: users[1]!.id, role: "owner" },
    });

    const otherList = await appFor(users[2]!).request(
      "http://localhost:3000/api/v1/manager/organizations",
    );
    expect(await otherList.json()).toEqual({ organizations: [] });
    const crossTenant = await appFor(users[2]!).request(
      `http://localhost:3000/api/v1/manager/organizations/${organizationId}`,
    );
    expect(crossTenant.status).toBe(404);
    expect(await crossTenant.json()).toMatchObject({ error: { code: "ORGANIZATION_NOT_FOUND" } });
  });
});
