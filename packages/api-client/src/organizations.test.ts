import { describe, expect, it } from "vitest";

import { createAdminOrganizationClient, createOrganizationClient } from "./organizations";

const result = {
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
    userId: "user-1",
    role: "owner",
    createdAt: "2026-09-12T20:00:00.000Z",
  },
};

describe("Organization clients", () => {
  it("uses credentialed manager requests and scopes Organization lookups", async () => {
    const requests: Request[] = [];
    const client = createOrganizationClient("http://localhost:3000/", async (input, init) => {
      const request = new Request(input, init);
      requests.push(request);
      if (request.url.endsWith("/organizations/organization-1")) {
        return new Response(JSON.stringify(result), { status: 200 });
      }
      return new Response(JSON.stringify({ organizations: [result] }), { status: 200 });
    });

    await expect(client.listOrganizations()).resolves.toEqual({ organizations: [result] });
    await expect(client.getOrganization("organization-1")).resolves.toEqual(result);
    expect(requests[0]!.credentials).toBe("include");
    expect(requests[1]!.url).toBe(
      "http://localhost:3000/api/v1/manager/organizations/organization-1",
    );
  });

  it("searches eligible users and sends an idempotency key for admin creation", async () => {
    const requests: Request[] = [];
    const client = createAdminOrganizationClient("http://localhost:3000", async (input, init) => {
      const request = new Request(input, init);
      requests.push(request);
      if (request.method === "POST") return new Response(JSON.stringify(result), { status: 201 });
      return new Response(
        JSON.stringify({
          users: [
            { id: "user-1", name: "Owner", email: "owner@example.test", emailVerified: true },
          ],
        }),
        { status: 200 },
      );
    });

    await expect(client.searchEligibleUsers("owner@example.test")).resolves.toMatchObject({
      users: [{ id: "user-1" }],
    });
    await expect(
      client.createOrganization(
        {
          name: "Brussels Athletics Organization",
          slug: "brussels-athletics-organization",
          ownerUserId: "user-1",
        },
        "retry-key",
      ),
    ).resolves.toEqual(result);
    expect(requests[1]!.headers.get("Idempotency-Key")).toBe("retry-key");
    expect(await requests[1]!.json()).toMatchObject({ ownerUserId: "user-1" });
  });

  it("keeps one creation key across recoverable retries and rotates it after success", async () => {
    const requests: Request[] = [];
    let attempts = 0;
    const client = createAdminOrganizationClient("http://localhost:3000", async (input, init) => {
      const request = new Request(input, init);
      requests.push(request);
      attempts += 1;
      if (attempts === 1) {
        return new Response(
          JSON.stringify({
            error: {
              code: "INTERNAL_SERVER_ERROR",
              message: "Temporary failure",
              requestId: "request-1",
              details: {},
            },
          }),
          { status: 503 },
        );
      }
      return new Response(JSON.stringify(result), { status: 201 });
    });
    const input = {
      name: "Brussels Athletics Organization",
      slug: "brussels-athletics-organization",
      ownerUserId: "user-1",
    };

    await expect(client.createOrganization(input)).rejects.toMatchObject({ status: 503 });
    await expect(client.createOrganization(input)).resolves.toEqual(result);
    expect(requests[0]!.headers.get("Idempotency-Key")).toBe(
      requests[1]!.headers.get("Idempotency-Key"),
    );

    await expect(
      client.createOrganization({ ...input, slug: "another-organization" }),
    ).resolves.toEqual(result);
    expect(requests[2]!.headers.get("Idempotency-Key")).not.toBe(
      requests[1]!.headers.get("Idempotency-Key"),
    );
  });
});
