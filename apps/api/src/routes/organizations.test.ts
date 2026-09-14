import type { User } from "@repo/utils";
import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";

import { createOrganizationRoutes, type OrganizationRepository } from "./organizations";

const platformAdmin: User = {
  id: "A".repeat(32),
  name: "Platform Admin",
  email: "admin@example.com",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  role: "admin",
};

const owner: User = {
  id: "B".repeat(32),
  name: "Organization Owner",
  email: "owner@example.com",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  role: "user",
};

const otherUser: User = {
  id: "C".repeat(32),
  name: "Other User",
  email: "other@example.com",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  role: "user",
};

describe("organization routes", () => {
  let repository: OrganizationRepository;

  beforeEach(() => {
    const organizations = new Map<
      string,
      { id: string; name: string; slug: string; ownerId: string }
    >();
    const users = new Set([platformAdmin.id, owner.id, otherUser.id]);

    repository = {
      ownerExists: async (id) => users.has(id),
      create: async (input) => {
        const organization = { id: "organization-1", ...input };
        organizations.set(organization.id, organization);
        return organization;
      },
      findById: async (id) => organizations.get(id) ?? null,
    };
  });

  function appFor(user: User | null) {
    return new Hono()
      .use("*", async (c, next) => {
        c.set("user", user);
        await next();
      })
      .route("/organizations", createOrganizationRoutes(repository));
  }

  it("lets a platform administrator create an organization with a recorded owner", async () => {
    const response = await appFor(platformAdmin).request("/organizations", {
      method: "POST",
      body: JSON.stringify({
        name: "Brussels Athletics",
        slug: "brussels-athletics",
        ownerId: owner.id,
      }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      id: "organization-1",
      name: "Brussels Athletics",
      slug: "brussels-athletics",
      ownerId: owner.id,
    });
  });

  it("refuses organization creation by a user who is not a platform administrator", async () => {
    const response = await appFor(owner).request("/organizations", {
      method: "POST",
      body: JSON.stringify({
        name: "Brussels Athletics",
        slug: "brussels-athletics",
        ownerId: owner.id,
      }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Platform administrator required" });
  });

  it("lets the recorded owner load the organization dashboard", async () => {
    await repository.create({
      name: "Brussels Athletics",
      slug: "brussels-athletics",
      ownerId: owner.id,
    });

    const response = await appFor(owner).request("/organizations/organization-1/dashboard");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: "organization-1",
      ownerId: owner.id,
    });
  });

  it("refuses a signed-in user who is not the organization owner without returning data", async () => {
    await repository.create({
      name: "Brussels Athletics",
      slug: "brussels-athletics",
      ownerId: owner.id,
    });

    const response = await appFor(otherUser).request("/organizations/organization-1/dashboard");

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Organization owner required" });
  });
});
