import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

const competitionFindMany = vi.fn();
const competitionFindFirst = vi.fn();
const disciplineFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    competition: { findMany: competitionFindMany, findFirst: competitionFindFirst },
    discipline: { findMany: disciplineFindMany },
  },
}));

const ids = {
  competition: "10000000-0000-4000-8000-000000000001",
  event: "20000000-0000-4000-8000-000000000001",
  discipline: "30000000-0000-4000-8000-000000000001",
  category: "40000000-0000-4000-8000-000000000001",
  round: "50000000-0000-4000-8000-000000000001",
};

const translations = [{ locale: "EN", name: "Brussels Open", description: "A meeting." }];
const discipline = {
  id: ids.discipline,
  code: "100M",
  measurement: "TIME",
  translations: [{ locale: "EN", name: "100 metres", abbreviation: "100 m" }],
};

const summaryRecord = {
  id: ids.competition,
  primaryLocale: "EN",
  lifecycleState: "PUBLISHED",
  registrationState: "OPEN",
  startsAt: new Date("2027-05-24T12:00:00.000Z"),
  endsAt: new Date("2027-05-24T20:00:00.000Z"),
  timeZone: "Europe/Brussels",
  registrationOpensAt: new Date("2027-05-01T00:00:00.000Z"),
  registrationClosesAt: new Date("2027-05-20T21:59:00.000Z"),
  contactName: "Meeting team",
  contactEmail: "meeting@example.com",
  contactPhone: null,
  translations,
  organization: {
    id: "organization-1",
    name: "Brussels Athletics",
    slug: "brussels-athletics",
    logo: null,
  },
  venue: {
    competitionId: ids.competition,
    name: "Stade des Trois Tilleuls",
    addressLine1: "Avenue des Trophees 1",
    addressLine2: null,
    postalCode: "1190",
    city: "Forest",
    region: "Brussels",
    countryCode: "BE",
    latitude: 50.8,
    longitude: 4.3,
  },
  events: [{ discipline }],
};

async function createTestApp() {
  const { publicCompetitionsRoutes } = await import("./public-competitions");
  return new Hono().route("/", publicCompetitionsRoutes);
}

describe("public Competition routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    competitionFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([summaryRecord]);
    disciplineFindMany.mockResolvedValue([discipline]);
    competitionFindFirst.mockResolvedValue(null);
  });

  it("lists future published Competitions and public Discipline filters", async () => {
    const app = await createTestApp();
    const response = await app.request("/?q=Brussels&disciplineId=" + ids.discipline);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      competitions: [
        {
          id: ids.competition,
          startsAt: "2027-05-24T12:00:00.000Z",
          translations,
          disciplines: [discipline],
        },
      ],
      disciplines: [discipline],
      nextCursor: null,
    });
    expect(competitionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { lifecycleState: "PUBLISHED" },
            { events: { some: { active: true, disciplineId: ids.discipline } } },
          ]),
        }),
        take: 13,
      }),
    );
  });

  it("rejects an invalid cursor", async () => {
    const app = await createTestApp();
    const response = await app.request("/?cursor=not-a-cursor");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid Competition cursor" });
    expect(competitionFindMany).not.toHaveBeenCalled();
  });

  it("returns a public detail with every Pricing Tier and no assignment identifiers", async () => {
    competitionFindFirst.mockResolvedValue({
      ...summaryRecord,
      events: [
        {
          id: ids.event,
          kind: "INDIVIDUAL",
          registerable: true,
          translations: [{ locale: "EN", name: "Women 100 metres", description: null }],
          discipline,
          eligibility: [
            {
              athleteCategory: {
                id: ids.category,
                code: "SEN-W",
                translations: [{ locale: "EN", name: "Senior women", abbreviation: "SEN W" }],
              },
            },
          ],
          rounds: [
            {
              id: ids.round,
              sequence: 1,
              label: "Final",
              scheduledStartAt: new Date("2027-05-24T14:20:00.000Z"),
              status: "NOT_STARTED",
              _count: { startGroups: 2 },
            },
          ],
        },
      ],
      pricingTiers: [
        {
          name: "Standard",
          isDefault: true,
          clubAssignments: [],
          eventPrices: [
            { competitionEventId: ids.event, pricingTierId: "private-tier-id", priceCents: 600 },
          ],
        },
        {
          name: "Partner clubs",
          isDefault: false,
          clubAssignments: [
            {
              id: "private-assignment-id",
              club: { name: "Brussels Athletics", abbreviation: "RBA" },
            },
          ],
          eventPrices: [
            { competitionEventId: ids.event, pricingTierId: "private-tier-id-2", priceCents: 400 },
          ],
        },
      ],
    });
    const app = await createTestApp();
    const response = await app.request(`/${ids.competition}`);

    expect(response.status).toBe(200);
    const body = (await response.json()) as { competition: { pricingTiers: unknown[] } };
    expect(body.competition.pricingTiers).toEqual([
      {
        name: "Standard",
        isDefault: true,
        clubs: [],
        prices: [{ competitionEventId: ids.event, priceCents: 600 }],
      },
      {
        name: "Partner clubs",
        isDefault: false,
        clubs: [{ name: "Brussels Athletics", abbreviation: "RBA" }],
        prices: [{ competitionEventId: ids.event, priceCents: 400 }],
      },
    ]);
    expect(JSON.stringify(body)).not.toContain("private-");
  });

  it("uses the same not-found response for malformed and hidden Competition IDs", async () => {
    const app = await createTestApp();
    const malformed = await app.request("/not-a-uuid");
    const hidden = await app.request(`/${ids.competition}`);

    expect(malformed.status).toBe(404);
    expect(hidden.status).toBe(404);
    await expect(malformed.json()).resolves.toEqual({ error: "Competition not found" });
    await expect(hidden.json()).resolves.toEqual({ error: "Competition not found" });
    expect(competitionFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ids.competition, lifecycleState: { not: "DRAFT" } },
      }),
    );
  });
});
