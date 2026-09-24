import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
const findUnique = vi.fn();
const findUsers = vi.fn();
const findOrganizationBySlug = vi.fn();
const createOrganization = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: { findMany, findUnique: findOrganizationBySlug },
    user: { findMany: findUsers, findUnique },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: { createOrganization },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn() },
}));

const admin = {
  id: "A".repeat(32),
  name: "Platform Admin",
  email: "admin@example.com",
  emailVerified: true,
  image: null,
  createdAt: new Date("2026-09-18T00:00:00.000Z"),
  updatedAt: new Date("2026-09-18T00:00:00.000Z"),
  role: "admin" as const,
  banned: false,
  banReason: null,
  banExpires: null,
};

async function createTestApp(
  user: Omit<typeof admin, "role"> & { role: "admin" | "user" } = admin,
) {
  const { organizationsRoutes } = await import("./organizations");

  return new Hono()
    .use("*", async (c, next) => {
      c.set("user", user);
      c.set("session", null);
      await next();
    })
    .route("/", organizationsRoutes);
}

describe("organization administration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findOrganizationBySlug.mockResolvedValue(null);
  });

  it("lists organizations with their owners", async () => {
    findMany.mockResolvedValue([
      {
        id: "O".repeat(32),
        name: "Brussels Athletics",
        slug: "brussels-athletics",
        logo: "https://example.com/brussels-athletics.svg",
        createdAt: new Date("2026-09-18T12:00:00.000Z"),
        members: [
          {
            user: {
              id: "U".repeat(32),
              name: "Morgan Owner",
              email: "owner@example.com",
            },
          },
        ],
      },
    ]);
    const app = await createTestApp();

    const response = await app.request("/");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      organizations: [
        {
          id: "O".repeat(32),
          name: "Brussels Athletics",
          slug: "brussels-athletics",
          logo: "https://example.com/brussels-athletics.svg",
          createdAt: "2026-09-18T12:00:00.000Z",
          owner: {
            id: "U".repeat(32),
            name: "Morgan Owner",
            email: "owner@example.com",
          },
        },
      ],
    });
  });

  it("searches verified regular users who can own an organization", async () => {
    findUsers.mockResolvedValue([
      { id: "U".repeat(32), name: "Morgan Owner", email: "owner@example.com" },
    ]);
    const app = await createTestApp();

    const response = await app.request("/owner-candidates?search=morgan");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      users: [{ id: "U".repeat(32), name: "Morgan Owner", email: "owner@example.com" }],
    });
    expect(findUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ role: "user", emailVerified: true }),
        take: 25,
      }),
    );
  });

  it("always includes the current admin even when the regular-user list is full", async () => {
    findUsers.mockResolvedValue(
      Array.from({ length: 25 }, (_, index) => ({
        id: `${index}`.padStart(32, "U"),
        name: `Regular User ${index}`,
        email: `user${index}@example.com`,
      })),
    );
    const app = await createTestApp();

    const response = await app.request("/owner-candidates");
    const body = (await response.json()) as {
      users: Array<{ id: string; name: string; email: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.users).toHaveLength(26);
    expect(body.users).toContainEqual({ id: admin.id, name: admin.name, email: admin.email });
  });

  it("allows the current platform administrator to own the organization", async () => {
    findUnique.mockResolvedValue(admin);
    createOrganization.mockResolvedValue({
      id: "O".repeat(32),
      name: "Brussels Athletics",
      slug: "brussels-athletics",
      logo: null,
      createdAt: new Date("2026-09-18T12:00:00.000Z"),
    });
    const app = await createTestApp();

    const response = await app.request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Brussels Athletics",
        slug: "brussels-athletics",
        ownerId: admin.id,
      }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      organization: { owner: { id: admin.id, email: admin.email } },
    });
  });

  it("does not allow an administrator to assign another admin as owner", async () => {
    const otherAdmin = { ...admin, id: "B".repeat(32) };
    findUnique.mockResolvedValue(otherAdmin);
    const app = await createTestApp();

    const response = await app.request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Brussels Athletics",
        slug: "brussels-athletics",
        ownerId: otherAdmin.id,
      }),
    });

    expect(response.status).toBe(400);
    expect(createOrganization).not.toHaveBeenCalled();
  });

  it("rejects an unverified user as organization owner", async () => {
    const owner = {
      id: "U".repeat(32),
      name: "Morgan Owner",
      email: "owner@example.com",
      emailVerified: false,
      role: "user",
    };
    findUnique.mockResolvedValue(owner);
    const app = await createTestApp();

    const response = await app.request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Brussels Athletics",
        slug: "brussels-athletics",
        ownerId: owner.id,
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Organization owners must have a verified email",
    });
    expect(createOrganization).not.toHaveBeenCalled();
  });

  it("creates an organization for the selected owner", async () => {
    const owner = {
      id: "U".repeat(32),
      name: "Morgan Owner",
      email: "owner@example.com",
      emailVerified: true,
      role: "user",
    };
    findUnique.mockResolvedValue(owner);
    createOrganization.mockResolvedValue({
      id: "O".repeat(32),
      name: "Brussels Athletics",
      slug: "brussels-athletics",
      logo: "https://example.com/brussels-athletics.svg",
      createdAt: new Date("2026-09-18T12:00:00.000Z"),
    });
    const app = await createTestApp();

    const response = await app.request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Brussels Athletics",
        slug: "brussels-athletics",
        logo: "https://example.com/brussels-athletics.svg",
        ownerId: owner.id,
      }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      organization: {
        id: "O".repeat(32),
        name: "Brussels Athletics",
        slug: "brussels-athletics",
        logo: "https://example.com/brussels-athletics.svg",
        createdAt: "2026-09-18T12:00:00.000Z",
        owner: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
        },
      },
    });
    expect(createOrganization).toHaveBeenCalledWith({
      body: {
        name: "Brussels Athletics",
        slug: "brussels-athletics",
        logo: "https://example.com/brussels-athletics.svg",
        userId: owner.id,
      },
    });
  });

  it("returns a conflict when a concurrent request takes the slug", async () => {
    const owner = {
      id: "U".repeat(32),
      name: "Morgan Owner",
      email: "owner@example.com",
      emailVerified: true,
      role: "user",
    };
    findUnique.mockResolvedValue(owner);
    createOrganization.mockRejectedValue({ code: "P2002" });
    const app = await createTestApp();

    const response = await app.request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Brussels Athletics",
        slug: "brussels-athletics",
        ownerId: owner.id,
      }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "An organization with this slug already exists",
    });
  });

  it("rejects organization administration by a regular user", async () => {
    const app = await createTestApp({ ...admin, id: "U".repeat(32), role: "user" });

    const response = await app.request("/");

    expect(response.status).toBe(403);
    expect(findMany).not.toHaveBeenCalled();
  });

});
