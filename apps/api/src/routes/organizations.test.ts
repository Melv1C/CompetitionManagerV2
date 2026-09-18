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

  it("searches regular users who can own an organization", async () => {
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
        where: expect.objectContaining({ role: "user" }),
        take: 25,
      }),
    );
  });

  it("creates an organization for the selected owner", async () => {
    const owner = {
      id: "U".repeat(32),
      name: "Morgan Owner",
      email: "owner@example.com",
      role: "user",
    };
    findUnique.mockResolvedValue(owner);
    createOrganization.mockResolvedValue({
      id: "O".repeat(32),
      name: "Brussels Athletics",
      slug: "brussels-athletics",
      createdAt: new Date("2026-09-18T12:00:00.000Z"),
    });
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

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      organization: {
        id: "O".repeat(32),
        name: "Brussels Athletics",
        slug: "brussels-athletics",
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
        userId: owner.id,
      },
    });
  });

  it("returns a conflict when a concurrent request takes the slug", async () => {
    const owner = {
      id: "U".repeat(32),
      name: "Morgan Owner",
      email: "owner@example.com",
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

  it("rejects a platform administrator as organization owner", async () => {
    findUnique.mockResolvedValue(admin);
    const app = await createTestApp();

    const response = await app.request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Admin-owned Athletics",
        slug: "admin-owned-athletics",
        ownerId: admin.id,
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Platform administrators cannot own organizations",
    });
    expect(createOrganization).not.toHaveBeenCalled();
  });
});
