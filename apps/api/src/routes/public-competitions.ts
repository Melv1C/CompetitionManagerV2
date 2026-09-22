import { zValidator } from "@hono/zod-validator";
import {
  PublicCompetitionIdParams$,
  PublicCompetitionListQuery$,
  PublicCompetitionListResponse$,
  PublicCompetitionResponse$,
} from "@repo/utils";
import { Hono } from "hono";
import * as z from "zod";

import { prisma, type Prisma } from "@/lib/prisma";

const PublicCursor$ = z.object({
  lifecycleState: z.enum(["IN_PROGRESS", "PUBLISHED"]),
  startsAt: z.iso.datetime(),
  id: z.uuid(),
});

type PublicCursor = z.infer<typeof PublicCursor$>;

const summaryInclude = {
  organization: { select: { id: true, name: true, slug: true, logo: true } },
  venue: true,
  translations: { orderBy: { locale: "asc" as const } },
  events: {
    where: { active: true },
    select: {
      discipline: {
        select: {
          id: true,
          code: true,
          measurement: true,
          translations: { orderBy: { locale: "asc" as const } },
        },
      },
    },
  },
} satisfies Prisma.CompetitionInclude;

const detailInclude = {
  organization: { select: { id: true, name: true, slug: true, logo: true } },
  venue: true,
  translations: { orderBy: { locale: "asc" as const } },
  events: {
    where: { active: true },
    include: {
      translations: { orderBy: { locale: "asc" as const } },
      discipline: {
        select: {
          id: true,
          code: true,
          measurement: true,
          translations: { orderBy: { locale: "asc" as const } },
        },
      },
      eligibility: {
        include: {
          athleteCategory: {
            select: {
              id: true,
              code: true,
              translations: { orderBy: { locale: "asc" as const } },
            },
          },
        },
      },
      rounds: {
        where: { scheduledStartAt: { not: null } },
        include: { _count: { select: { startGroups: true } } },
        orderBy: [{ scheduledStartAt: "asc" as const }, { sequence: "asc" as const }],
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  pricingTiers: {
    include: {
      clubAssignments: {
        include: { club: { select: { name: true, abbreviation: true } } },
        orderBy: { club: { name: "asc" as const } },
      },
      eventPrices: { orderBy: { competitionEventId: "asc" as const } },
    },
    orderBy: [{ isDefault: "desc" as const }, { name: "asc" as const }],
  },
} satisfies Prisma.CompetitionInclude;

type SummaryRecord = Prisma.CompetitionGetPayload<{ include: typeof summaryInclude }>;
type DetailRecord = Prisma.CompetitionGetPayload<{ include: typeof detailInclude }>;

class PublicCompetitionRouteError extends Error {
  constructor(
    readonly status: 400 | 404,
    message: string,
  ) {
    super(message);
  }
}

function encodeCursor(record: Pick<SummaryRecord, "id" | "lifecycleState" | "startsAt">) {
  if (!record.startsAt || !["IN_PROGRESS", "PUBLISHED"].includes(record.lifecycleState)) {
    throw new Error("Cannot create a public Competition cursor");
  }
  return Buffer.from(
    JSON.stringify({
      lifecycleState: record.lifecycleState,
      startsAt: record.startsAt.toISOString(),
      id: record.id,
    }),
  ).toString("base64url");
}

function decodeCursor(value: string | undefined): PublicCursor | undefined {
  if (!value) return undefined;
  try {
    return PublicCursor$.parse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
  } catch {
    throw new PublicCompetitionRouteError(400, "Invalid Competition cursor");
  }
}

function publicCollectionWhere(now: Date, q?: string): Prisma.CompetitionWhereInput {
  return {
    AND: [
      {
        startsAt: { not: null },
        endsAt: { not: null },
        OR: [
          { lifecycleState: "IN_PROGRESS" },
          { lifecycleState: "PUBLISHED", endsAt: { gte: now } },
        ],
      },
      ...(q
        ? [
            {
              OR: [
                { translations: { some: { name: { contains: q, mode: "insensitive" } } } },
                { organization: { name: { contains: q, mode: "insensitive" } } },
                { venue: { is: { name: { contains: q, mode: "insensitive" } } } },
                { venue: { is: { city: { contains: q, mode: "insensitive" } } } },
              ],
            } satisfies Prisma.CompetitionWhereInput,
          ]
        : []),
    ],
  };
}

function afterCursor(cursor: PublicCursor): Prisma.CompetitionWhereInput {
  const startsAt = new Date(cursor.startsAt);
  return {
    OR: [{ startsAt: { gt: startsAt } }, { startsAt, id: { gt: cursor.id } }],
  };
}

async function findCollectionPage(input: {
  q?: string;
  disciplineId?: string;
  cursor?: PublicCursor;
  limit: number;
  now: Date;
}) {
  const commonWhere = publicCollectionWhere(input.now, input.q);
  const disciplineWhere = input.disciplineId
    ? { events: { some: { active: true, disciplineId: input.disciplineId } } }
    : {};
  const records: SummaryRecord[] = [];
  const take = input.limit + 1;

  if (!input.cursor || input.cursor.lifecycleState === "IN_PROGRESS") {
    const inProgress = await prisma.competition.findMany({
      where: {
        AND: [
          commonWhere,
          disciplineWhere,
          { lifecycleState: "IN_PROGRESS" },
          ...(input.cursor ? [afterCursor(input.cursor)] : []),
        ],
      },
      include: summaryInclude,
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
      take,
    });
    records.push(...inProgress);
  }

  if (records.length < take) {
    const publishedCursor = input.cursor?.lifecycleState === "PUBLISHED" ? input.cursor : undefined;
    const published = await prisma.competition.findMany({
      where: {
        AND: [
          commonWhere,
          disciplineWhere,
          { lifecycleState: "PUBLISHED" },
          ...(publishedCursor ? [afterCursor(publishedCursor)] : []),
        ],
      },
      include: summaryInclude,
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
      take: take - records.length,
    });
    records.push(...published);
  }

  return {
    records: records.slice(0, input.limit),
    nextCursor: records.length > input.limit ? encodeCursor(records[input.limit - 1]!) : null,
  };
}

function serializeVenue(venue: SummaryRecord["venue"]) {
  if (!venue) throw new Error("A public Competition must have a Venue");
  return {
    ...venue,
    latitude: venue.latitude === null ? null : Number(venue.latitude),
    longitude: venue.longitude === null ? null : Number(venue.longitude),
  };
}

function serializeDiscipline(discipline: SummaryRecord["events"][number]["discipline"]) {
  return discipline;
}

function serializeSummary(record: SummaryRecord) {
  if (
    !record.startsAt ||
    !record.endsAt ||
    !record.timeZone ||
    !record.registrationOpensAt ||
    !record.registrationClosesAt
  ) {
    throw new Error("A public Competition is missing required publication data");
  }

  const disciplines = new Map(
    record.events.map(({ discipline }) => [discipline.id, serializeDiscipline(discipline)]),
  );
  return {
    id: record.id,
    primaryLocale: record.primaryLocale,
    lifecycleState: record.lifecycleState,
    registrationState: record.registrationState,
    startsAt: record.startsAt.toISOString(),
    endsAt: record.endsAt.toISOString(),
    timeZone: record.timeZone,
    registrationOpensAt: record.registrationOpensAt.toISOString(),
    registrationClosesAt: record.registrationClosesAt.toISOString(),
    translations: record.translations,
    organization: record.organization,
    venue: serializeVenue(record.venue),
    disciplines: [...disciplines.values()],
  };
}

function serializeDetail(record: DetailRecord) {
  const summary = serializeSummary(record);
  return {
    ...summary,
    contactName: record.contactName,
    contactEmail: record.contactEmail,
    contactPhone: record.contactPhone,
    events: record.events.map((event) => ({
      id: event.id,
      kind: event.kind,
      registerable: event.registerable,
      translations: event.translations,
      discipline: event.discipline,
      eligibility: event.eligibility.map(({ athleteCategory }) => athleteCategory),
      rounds: event.rounds.flatMap((round) =>
        round.scheduledStartAt
          ? [
              {
                id: round.id,
                sequence: round.sequence,
                label: round.label,
                scheduledStartAt: round.scheduledStartAt.toISOString(),
                status: round.status,
                startGroupCount: round._count.startGroups,
              },
            ]
          : [],
      ),
    })),
    pricingTiers: record.pricingTiers.map((tier) => ({
      name: tier.name,
      isDefault: tier.isDefault,
      clubs: tier.clubAssignments.map(({ club }) => club),
      prices: tier.eventPrices.map((price) => ({
        competitionEventId: price.competitionEventId,
        priceCents: price.priceCents,
      })),
    })),
  };
}

export const publicCompetitionsRoutes = new Hono()
  .onError((error, c) => {
    if (error instanceof PublicCompetitionRouteError) {
      return c.json({ error: error.message }, error.status);
    }
    throw error;
  })
  .get("/", zValidator("query", PublicCompetitionListQuery$), async (c) => {
    const query = c.req.valid("query");
    const now = new Date();
    const cursor = decodeCursor(query.cursor);
    const collectionWhere = publicCollectionWhere(now, query.q);
    const [{ records, nextCursor }, disciplines] = await Promise.all([
      findCollectionPage({ ...query, cursor, now }),
      prisma.discipline.findMany({
        where: {
          active: true,
          events: { some: { active: true, competition: collectionWhere } },
        },
        select: {
          id: true,
          code: true,
          measurement: true,
          translations: { orderBy: { locale: "asc" } },
        },
        orderBy: { code: "asc" },
      }),
    ]);

    const response = PublicCompetitionListResponse$.parse({
      competitions: records.map(serializeSummary),
      disciplines,
      nextCursor,
    });
    return c.json(response);
  })
  .get(
    "/:competitionId",
    zValidator("param", PublicCompetitionIdParams$, (result, c) => {
      if (!result.success) return c.json({ error: "Competition not found" }, 404);
    }),
    async (c) => {
      const { competitionId } = c.req.valid("param");
      const competition = await prisma.competition.findFirst({
        where: { id: competitionId, lifecycleState: { not: "DRAFT" } },
        include: detailInclude,
      });
      if (!competition) return c.json({ error: "Competition not found" }, 404);

      const response = PublicCompetitionResponse$.parse({
        competition: serializeDetail(competition),
      });
      return c.json(response);
    },
  );
