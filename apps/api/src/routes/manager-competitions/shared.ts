import { type Context } from "hono";

import { prisma, type Prisma } from "@/lib/prisma";

const competitionInclude = {
  athleticsSeason: true,
  translations: { orderBy: { locale: "asc" as const } },
  venue: true,
  clubEligibility: { include: { club: true }, orderBy: { club: { name: "asc" as const } } },
  pricingTiers: {
    include: {
      clubAssignments: { include: { club: true }, orderBy: { club: { name: "asc" as const } } },
    },
    orderBy: [{ isDefault: "desc" as const }, { name: "asc" as const }],
  },
  events: {
    include: {
      discipline: { include: { translations: true } },
      translations: { orderBy: { locale: "asc" as const } },
      eligibility: {
        include: { athleteCategory: { include: { translations: true } } },
      },
      prices: true,
      rounds: {
        include: { startGroups: { orderBy: { sequence: "asc" as const } } },
        orderBy: { sequence: "asc" as const },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.CompetitionInclude;

type CompetitionRecord = Prisma.CompetitionGetPayload<{ include: typeof competitionInclude }>;

export function serializeCompetition(competition: CompetitionRecord) {
  return {
    ...competition,
    venue: competition.venue
      ? {
          ...competition.venue,
          latitude: competition.venue.latitude === null ? null : Number(competition.venue.latitude),
          longitude:
            competition.venue.longitude === null ? null : Number(competition.venue.longitude),
        }
      : null,
    readiness: getReadiness(competition),
  };
}

export function primaryName(competition: {
  translations: Array<{ locale: string; name: string }>;
  primaryLocale: string;
}) {
  return (
    competition.translations.find((translation) => translation.locale === competition.primaryLocale)
      ?.name ??
    competition.translations[0]?.name ??
    "Untitled Competition"
  );
}

export function getReadiness(competition: CompetitionRecord) {
  const missing = new Set<string>();
  const primaryTranslation = competition.translations.find(
    (translation) => translation.locale === competition.primaryLocale,
  );
  if (!primaryTranslation?.name.trim()) missing.add("Add the primary Competition name.");
  if (!competition.startsAt || !competition.endsAt || !competition.timeZone) {
    missing.add("Set the Competition dates and time zone.");
  }
  if (!competition.registrationOpensAt || !competition.registrationClosesAt) {
    missing.add("Set the registration window.");
  }
  if (!competition.contactName?.trim() || !competition.contactEmail?.trim()) {
    missing.add("Add a contact name and email.");
  }
  if (
    !competition.venue?.name.trim() ||
    !competition.venue.addressLine1.trim() ||
    !competition.venue.postalCode.trim() ||
    !competition.venue.city.trim() ||
    !competition.venue.countryCode.trim()
  ) {
    missing.add("Complete the Venue address.");
  }
  if (
    competition.oneDayRegistrationEnabled &&
    (!competition.oneDayBibStart || !competition.oneDayBibEnd)
  ) {
    missing.add("Set the one-day Athlete bib range.");
  }

  const defaultTier = competition.pricingTiers.find((tier) => tier.isDefault);
  if (!defaultTier) missing.add("Add a default Pricing Tier.");
  const activeEvents = competition.events.filter((event) => event.active);
  if (activeEvents.length === 0) missing.add("Add at least one Competition Event.");

  for (const event of activeEvents) {
    const eventName =
      event.translations.find((translation) => translation.locale === competition.primaryLocale)
        ?.name ?? "An Event";
    if (
      !event.translations.some((translation) => translation.locale === competition.primaryLocale)
    ) {
      missing.add(`${eventName} needs a name in the primary locale.`);
    }
    if (event.discipline.translations.length === 0) {
      missing.add(`${eventName} needs a Discipline translation.`);
    }
    if (event.eligibility.length === 0) {
      missing.add(`${eventName} needs at least one eligible Athlete Category.`);
    }
    if (
      event.eligibility.some(({ athleteCategory }) => athleteCategory.translations.length === 0)
    ) {
      missing.add(`${eventName} needs translations for every eligible Athlete Category.`);
    }
    if (event.kind === "RELAY" && !event.relayLegCount) {
      missing.add(`${eventName} needs a relay leg count.`);
    }
    if (event.rounds.length === 0 || event.rounds.some((round) => !round.scheduledStartAt)) {
      missing.add(`${eventName} needs a scheduled Round.`);
    }
    if (
      competition.startsAt &&
      competition.endsAt &&
      event.rounds.some(
        (round) =>
          round.scheduledStartAt &&
          (round.scheduledStartAt < competition.startsAt! ||
            round.scheduledStartAt > competition.endsAt!),
      )
    ) {
      missing.add(`${eventName} has a Round outside the Competition dates.`);
    }
    if (event.registerable) {
      const pricedTierIds = new Set(event.prices.map((price) => price.pricingTierId));
      if (competition.pricingTiers.some((tier) => !pricedTierIds.has(tier.id))) {
        missing.add(`${eventName} needs a price for every Pricing Tier.`);
      }
    }
  }

  return { ready: missing.size === 0, missing: [...missing] };
}

export async function findCompetition(organizationId: string, competitionId: string) {
  return prisma.competition.findFirst({
    where: { id: competitionId, organizationId },
    include: competitionInclude,
  });
}

export async function assertDraftVersion(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string;
    competitionId: string;
    expectedUpdatedAt: Date;
    actorUserId: string;
  },
) {
  const result = await tx.competition.updateMany({
    where: {
      id: input.competitionId,
      organizationId: input.organizationId,
      lifecycleState: "DRAFT",
      updatedAt: input.expectedUpdatedAt,
    },
    data: { updatedByUserId: input.actorUserId },
  });
  if (result.count === 1) return;

  const current = await tx.competition.findFirst({
    where: { id: input.competitionId, organizationId: input.organizationId },
    select: { lifecycleState: true },
  });
  if (!current) throw new CompetitionRouteError(404, "Competition not found");
  if (current.lifecycleState !== "DRAFT") {
    throw new CompetitionRouteError(409, "Published Competitions cannot be edited here");
  }
  throw new CompetitionRouteError(409, "This Draft changed. Reload it before saving again");
}

export async function assertEventCatalogReferences(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string;
    competitionId: string;
    disciplineId: string;
    athleteCategoryIds: string[];
  },
) {
  const competition = await tx.competition.findFirst({
    where: { id: input.competitionId, organizationId: input.organizationId },
    select: { id: true },
  });
  if (!competition) throw new CompetitionRouteError(404, "Competition not found");

  const discipline = await tx.discipline.findFirst({
    where: {
      id: input.disciplineId,
      active: true,
      OR: [{ organizationId: null }, { organizationId: input.organizationId }],
    },
    select: { id: true },
  });
  if (!discipline) {
    throw new CompetitionRouteError(400, "Discipline is not available to this Organization");
  }

  const categoryIds = [...new Set(input.athleteCategoryIds)];
  const categoryCount = await tx.athleteCategory.count({
    where: {
      id: { in: categoryIds },
      active: true,
      OR: [{ organizationId: null }, { organizationId: input.organizationId }],
    },
  });
  if (categoryCount !== categoryIds.length) {
    throw new CompetitionRouteError(400, "Athlete Category is not available to this Organization");
  }
}

export class CompetitionRouteError extends Error {
  constructor(
    readonly status: 400 | 404 | 409,
    message: string,
  ) {
    super(message);
  }
}

export function auditActor(c: Context) {
  const user = c.get("user")!;
  return {
    actorUserId: user.id,
    actorDisplayName: user.name,
    actorEmail: user.email,
  };
}
