import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

const seasons = vi.fn();
const disciplines = vi.fn();
const disciplineFirst = vi.fn();
const disciplineCreate = vi.fn();
const categories = vi.fn();
const clubs = vi.fn();
const updateCompetition = vi.fn();
const findCompetition = vi.fn();
const transaction = vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
  callback({ competition: { updateMany: updateCompetition, findFirst: findCompetition } }),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    athleticsSeason: { findMany: seasons },
    discipline: { findMany: disciplines, findFirst: disciplineFirst, create: disciplineCreate },
    athleteCategory: { findMany: categories },
    club: { findMany: clubs },
    competition: { findFirst: findCompetition },
    $transaction: transaction,
  },
}));
vi.mock("@/middlewares/use-organization-permission", () => ({
  hasOrganizationCompetitionPermission: () => async (_c: unknown, next: () => Promise<void>) =>
    next(),
}));

const organizationId = "10000000-0000-4000-8000-000000000001";

async function testApp() {
  const { managerCompetitionsRoutes } = await import("./manager-competitions");
  return new Hono()
    .use("*", async (c, next) => {
      c.set("user", {
        id: "A".repeat(32),
        name: "Test User",
        email: "test@example.com",
        emailVerified: true,
        image: null,
        createdAt: new Date("2026-09-23T00:00:00.000Z"),
        updatedAt: new Date("2026-09-23T00:00:00.000Z"),
        role: "user",
        banned: false,
        banReason: null,
        banExpires: null,
      });
      await next();
    })
    .route("/", managerCompetitionsRoutes);
}

describe("manager Competition catalogue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seasons.mockResolvedValue([]);
    disciplines.mockResolvedValue([]);
    categories.mockResolvedValue([]);
    clubs.mockResolvedValue([]);
  });

  it("lists active categories for the Organization without a season filter", async () => {
    const app = await testApp();
    const response = await app.request(`/${organizationId}/catalog`);
    expect(response.status).toBe(200);
    expect(categories).toHaveBeenCalledWith({
      where: { active: true, OR: [{ organizationId }, { organizationId: null }] },
      include: { translations: true },
      orderBy: { code: "asc" },
    });
  });

  it("creates a Discipline scoped to the Organization with its primary translation", async () => {
    disciplineFirst.mockResolvedValue(null);
    const record = {
      id: "20000000-0000-4000-8000-000000000001",
      organizationId,
      code: "CUSTOM-THROW-3KG",
      measurement: "DISTANCE",
      translations: [{ locale: "FR", name: "Lancer local 3 kg", abbreviation: null }],
    };
    disciplineCreate.mockResolvedValue(record);
    const app = await testApp();
    const response = await app.request(`/${organizationId}/catalog/disciplines`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: "custom-throw-3kg",
        measurement: "DISTANCE",
        translations: record.translations,
      }),
    });
    expect(response.status).toBe(201);
    expect(disciplineCreate).toHaveBeenCalledWith({
      data: {
        organizationId,
        code: "CUSTOM-THROW-3KG",
        measurement: "DISTANCE",
        translations: { create: record.translations },
      },
      include: { translations: true },
    });
  });

  it("rejects a code already visible from the platform", async () => {
    disciplineFirst.mockResolvedValue({ id: "platform-id" });
    const app = await testApp();
    const response = await app.request(`/${organizationId}/catalog/disciplines`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: "100M",
        measurement: "TIME",
        translations: [{ locale: "EN", name: "100 metres", abbreviation: null }],
      }),
    });
    expect(response.status).toBe(409);
    expect(disciplineCreate).not.toHaveBeenCalled();
  });

  it("returns a route error from a mounted Competition Event mutation", async () => {
    updateCompetition.mockResolvedValue({ count: 0 });
    findCompetition.mockResolvedValue(null);
    const app = await testApp();
    const response = await app.request(
      `/${organizationId}/competitions/20000000-0000-4000-8000-000000000001/events/30000000-0000-4000-8000-000000000001`,
      {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedUpdatedAt: "2026-09-23T00:00:00.000Z" }),
      },
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Competition not found" });
    expect(transaction).toHaveBeenCalledOnce();
  });
});
