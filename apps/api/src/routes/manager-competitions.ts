import { zValidator } from "@hono/zod-validator";
import {
  CompetitionIdParams$,
  CompetitionMutationVersion$,
  CreateCompetition$,
  DeleteDraftCompetition$,
  OrganizationIdParams$,
  PublishCompetition$,
  UpdateCompetitionDetails$,
  UpdateCompetitionPricing$,
  UpsertCompetitionEvent$,
} from "@repo/utils";
import { Hono, type Context } from "hono";
import * as z from "zod";

import { prisma, type Prisma } from "@/lib/prisma";
import { hasOrganizationCompetitionPermission } from "@/middlewares/use-organization-permission";

const CatalogQuery$ = z.object({ seasonId: z.uuid().optional() });

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

function serializeCompetition(competition: CompetitionRecord) {
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

function primaryName(competition: {
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

function getReadiness(competition: CompetitionRecord) {
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
    if (event.eligibility.length === 0) {
      missing.add(`${eventName} needs at least one eligible Athlete Category.`);
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

async function findCompetition(organizationId: string, competitionId: string) {
  return prisma.competition.findFirst({
    where: { id: competitionId, organizationId },
    include: competitionInclude,
  });
}

async function assertDraftVersion(
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

async function assertEventCatalogReferences(
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
    select: { athleticsSeasonId: true },
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
      athleticsSeasonId: competition.athleticsSeasonId,
      OR: [{ organizationId: null }, { organizationId: input.organizationId }],
    },
  });
  if (categoryCount !== categoryIds.length) {
    throw new CompetitionRouteError(
      400,
      "Athlete Category is not available to this Organization and Athletics Season",
    );
  }
}

class CompetitionRouteError extends Error {
  constructor(
    readonly status: 400 | 404 | 409,
    message: string,
  ) {
    super(message);
  }
}

function auditActor(c: Context) {
  const user = c.get("user")!;
  return {
    actorUserId: user.id,
    actorDisplayName: user.name,
    actorEmail: user.email,
  };
}

export const managerCompetitionsRoutes = new Hono()
  .onError((error, c) => {
    if (error instanceof CompetitionRouteError) {
      return c.json({ error: error.message }, error.status);
    }
    throw error;
  })
  .get(
    "/:organizationId/catalog",
    zValidator("param", OrganizationIdParams$),
    zValidator("query", CatalogQuery$),
    hasOrganizationCompetitionPermission("create"),
    async (c) => {
      const { organizationId } = c.req.valid("param");
      const { seasonId } = c.req.valid("query");
      const [seasons, disciplines, categories, clubs] = await Promise.all([
        prisma.athleticsSeason.findMany({ orderBy: { startsOn: "desc" } }),
        prisma.discipline.findMany({
          where: { active: true, OR: [{ organizationId: null }, { organizationId }] },
          include: { translations: true },
          orderBy: { code: "asc" },
        }),
        prisma.athleteCategory.findMany({
          where: {
            active: true,
            ...(seasonId ? { athleticsSeasonId: seasonId } : {}),
            OR: [{ organizationId }, { organizationId: null }],
          },
          include: { translations: true },
          orderBy: { code: "asc" },
        }),
        prisma.club.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      ]);
      return c.json({ seasons, disciplines, categories, clubs });
    },
  )
  .get(
    "/:organizationId/competitions",
    zValidator("param", OrganizationIdParams$),
    hasOrganizationCompetitionPermission("update"),
    async (c) => {
      const { organizationId } = c.req.valid("param");
      const records = await prisma.competition.findMany({
        where: { organizationId },
        include: { translations: true, _count: { select: { events: true } } },
        orderBy: { updatedAt: "desc" },
      });
      return c.json({
        competitions: records.map((record) => ({
          id: record.id,
          name: primaryName(record),
          lifecycleState: record.lifecycleState,
          registrationState: record.registrationState,
          startsAt: record.startsAt,
          endsAt: record.endsAt,
          updatedAt: record.updatedAt,
          eventCount: record._count.events,
        })),
      });
    },
  )
  .post(
    "/:organizationId/competitions",
    zValidator("param", OrganizationIdParams$),
    zValidator("json", CreateCompetition$),
    hasOrganizationCompetitionPermission("create"),
    async (c) => {
      const { organizationId } = c.req.valid("param");
      const input = c.req.valid("json");
      const actor = auditActor(c);
      const season = await prisma.athleticsSeason.findUnique({
        where: { id: input.athleticsSeasonId },
        select: { id: true },
      });
      if (!season) return c.json({ error: "Athletics Season not found" }, 404);

      const created = await prisma.$transaction(async (tx) => {
        const competition = await tx.competition.create({
          data: {
            organizationId,
            athleticsSeasonId: input.athleticsSeasonId,
            primaryLocale: input.primaryLocale,
            createdByUserId: actor.actorUserId,
            updatedByUserId: actor.actorUserId,
            translations: {
              create: { locale: input.primaryLocale, name: input.name, description: "" },
            },
            pricingTiers: { create: { name: "Standard", isDefault: true } },
          },
        });
        await tx.auditEntry.create({
          data: {
            organizationId,
            entityType: "COMPETITION",
            entityId: competition.id,
            action: "CREATE",
            ...actor,
            metadata: { section: "basics" },
          },
        });
        return competition;
      });
      const competition = await findCompetition(organizationId, created.id);
      return c.json({ competition: serializeCompetition(competition!) }, 201);
    },
  )
  .get(
    "/:organizationId/competitions/:competitionId/audit",
    zValidator("param", CompetitionIdParams$),
    hasOrganizationCompetitionPermission("update"),
    async (c) => {
      const { organizationId, competitionId } = c.req.valid("param");
      const entries = await prisma.auditEntry.findMany({
        where: {
          organizationId,
          OR: [
            { entityType: "COMPETITION", entityId: competitionId },
            {
              entityType: "COMPETITION_EVENT",
              metadata: { path: ["competitionId"], equals: competitionId },
            },
          ],
        },
        orderBy: { createdAt: "asc" },
        select: {
          entityType: true,
          entityId: true,
          action: true,
          actorDisplayName: true,
          reason: true,
          metadata: true,
          createdAt: true,
        },
      });
      return c.json({ entries });
    },
  )
  .get(
    "/:organizationId/competitions/:competitionId",
    zValidator("param", CompetitionIdParams$),
    hasOrganizationCompetitionPermission("update"),
    async (c) => {
      const { organizationId, competitionId } = c.req.valid("param");
      const competition = await findCompetition(organizationId, competitionId);
      if (!competition) return c.json({ error: "Competition not found" }, 404);
      return c.json({ competition: serializeCompetition(competition) });
    },
  )
  .put(
    "/:organizationId/competitions/:competitionId/details",
    zValidator("param", CompetitionIdParams$),
    zValidator("json", UpdateCompetitionDetails$),
    hasOrganizationCompetitionPermission("update"),
    async (c) => {
      const { organizationId, competitionId } = c.req.valid("param");
      const input = c.req.valid("json");
      const actor = auditActor(c);
      await prisma.$transaction(async (tx) => {
        await assertDraftVersion(tx, {
          organizationId,
          competitionId,
          expectedUpdatedAt: input.expectedUpdatedAt,
          actorUserId: actor.actorUserId,
        });
        if (!input.venue) {
          await tx.competitionVenue.deleteMany({ where: { competitionId } });
        }
        await tx.competition.update({
          where: { id: competitionId },
          data: {
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            timeZone: input.timeZone,
            registrationOpensAt: input.registrationOpensAt,
            registrationClosesAt: input.registrationClosesAt,
            contactName: input.contactName,
            contactEmail: input.contactEmail || null,
            contactPhone: input.contactPhone,
            maxEventEntriesPerAthlete: input.maxEventEntriesPerAthlete,
            oneDayRegistrationEnabled: input.oneDayRegistrationEnabled,
            oneDayBibStart: input.oneDayBibStart,
            oneDayBibEnd: input.oneDayBibEnd,
            capacityReservationMinutes: input.capacityReservationMinutes,
            settlementDelayDays: input.settlementDelayDays,
            translations: {
              deleteMany: {},
              create: input.translations,
            },
            clubEligibility: {
              deleteMany: {},
              create: input.clubEligibilityIds.map((clubId) => ({ clubId })),
            },
            ...(input.venue
              ? {
                  venue: {
                    upsert: {
                      create: input.venue,
                      update: input.venue,
                    },
                  },
                }
              : {}),
          },
        });
        await tx.auditEntry.create({
          data: {
            organizationId,
            entityType: "COMPETITION",
            entityId: competitionId,
            action: "UPDATE",
            ...actor,
            metadata: { section: "details" },
          },
        });
      });
      const competition = await findCompetition(organizationId, competitionId);
      return c.json({ competition: serializeCompetition(competition!) });
    },
  )
  .put(
    "/:organizationId/competitions/:competitionId/pricing",
    zValidator("param", CompetitionIdParams$),
    zValidator("json", UpdateCompetitionPricing$),
    hasOrganizationCompetitionPermission("update"),
    async (c) => {
      const { organizationId, competitionId } = c.req.valid("param");
      const input = c.req.valid("json");
      const actor = auditActor(c);
      await prisma.$transaction(async (tx) => {
        await assertDraftVersion(tx, {
          organizationId,
          competitionId,
          expectedUpdatedAt: input.expectedUpdatedAt,
          actorUserId: actor.actorUserId,
        });
        const retainedIds = input.tiers.flatMap((tier) => (tier.id ? [tier.id] : []));
        await tx.competitionPricingTier.deleteMany({
          where: { competitionId, ...(retainedIds.length ? { id: { notIn: retainedIds } } : {}) },
        });
        for (const tier of input.tiers) {
          const record = tier.id
            ? await tx.competitionPricingTier.update({
                where: { id: tier.id, competitionId },
                data: { name: tier.name, isDefault: tier.isDefault },
              })
            : await tx.competitionPricingTier.create({
                data: { competitionId, name: tier.name, isDefault: tier.isDefault },
              });
          await tx.competitionPricingTierClub.deleteMany({ where: { pricingTierId: record.id } });
          if (tier.clubIds.length) {
            await tx.competitionPricingTierClub.createMany({
              data: tier.clubIds.map((clubId) => ({
                competitionId,
                pricingTierId: record.id,
                clubId,
              })),
            });
          }
        }
        await tx.auditEntry.create({
          data: {
            organizationId,
            entityType: "COMPETITION",
            entityId: competitionId,
            action: "UPDATE",
            ...actor,
            metadata: { section: "pricing" },
          },
        });
      });
      const competition = await findCompetition(organizationId, competitionId);
      return c.json({ competition: serializeCompetition(competition!) });
    },
  )
  .post(
    "/:organizationId/competitions/:competitionId/events",
    zValidator("param", CompetitionIdParams$),
    zValidator("json", UpsertCompetitionEvent$),
    hasOrganizationCompetitionPermission("update"),
    async (c) => {
      const { organizationId, competitionId } = c.req.valid("param");
      const input = c.req.valid("json");
      const actor = auditActor(c);
      await prisma.$transaction(async (tx) => {
        await assertDraftVersion(tx, {
          organizationId,
          competitionId,
          expectedUpdatedAt: input.expectedUpdatedAt,
          actorUserId: actor.actorUserId,
        });
        await assertEventCatalogReferences(tx, {
          organizationId,
          competitionId,
          disciplineId: input.disciplineId,
          athleteCategoryIds: input.athleteCategoryIds,
        });
        const createdEvent = await tx.competitionEvent.create({
          data: eventCreateData(competitionId, input),
        });
        if (input.prices.length) {
          await tx.competitionEventPrice.createMany({
            data: input.prices.map((price) => ({
              competitionId,
              competitionEventId: createdEvent.id,
              pricingTierId: price.pricingTierId,
              priceCents: price.priceCents,
            })),
          });
        }
        await tx.auditEntry.create({
          data: {
            organizationId,
            entityType: "COMPETITION_EVENT",
            entityId: createdEvent.id,
            action: "CREATE",
            ...actor,
            metadata: { competitionId, section: "events" },
          },
        });
      });
      const competition = await findCompetition(organizationId, competitionId);
      return c.json({ competition: serializeCompetition(competition!) }, 201);
    },
  )
  .put(
    "/:organizationId/competitions/:competitionId/events/:eventId",
    zValidator("param", CompetitionIdParams$.extend({ eventId: z.uuid() })),
    zValidator("json", UpsertCompetitionEvent$),
    hasOrganizationCompetitionPermission("update"),
    async (c) => {
      const { organizationId, competitionId, eventId } = c.req.valid("param");
      const input = c.req.valid("json");
      const actor = auditActor(c);
      await prisma.$transaction(async (tx) => {
        await assertDraftVersion(tx, {
          organizationId,
          competitionId,
          expectedUpdatedAt: input.expectedUpdatedAt,
          actorUserId: actor.actorUserId,
        });
        await assertEventCatalogReferences(tx, {
          organizationId,
          competitionId,
          disciplineId: input.disciplineId,
          athleteCategoryIds: input.athleteCategoryIds,
        });
        const existing = await tx.competitionEvent.findFirst({
          where: { id: eventId, competitionId },
          select: { id: true },
        });
        if (!existing) throw new CompetitionRouteError(404, "Competition Event not found");
        await tx.competitionEventPrice.deleteMany({ where: { competitionEventId: eventId } });
        await tx.competitionEvent.update({
          where: { id: eventId },
          data: {
            disciplineId: input.disciplineId,
            kind: input.kind,
            relayLegCount: input.kind === "RELAY" ? input.relayLegCount : null,
            resultEntryMode: input.resultEntryMode,
            registerable: input.registerable,
            capacity: input.capacity,
            translations: { deleteMany: {}, create: input.translations },
            eligibility: {
              deleteMany: {},
              create: input.athleteCategoryIds.map((athleteCategoryId) => ({ athleteCategoryId })),
            },
            rounds: {
              deleteMany: {},
              create: input.rounds.map((round, index) => ({
                sequence: index + 1,
                label: round.label,
                scheduledStartAt: round.scheduledStartAt,
                startGroups: {
                  create: round.startGroups.map((group, groupIndex) => ({
                    sequence: groupIndex + 1,
                    label: group.label,
                    scheduledStartAt: group.scheduledStartAt,
                  })),
                },
              })),
            },
          },
        });
        if (input.prices.length) {
          await tx.competitionEventPrice.createMany({
            data: input.prices.map((price) => ({
              competitionId,
              competitionEventId: eventId,
              pricingTierId: price.pricingTierId,
              priceCents: price.priceCents,
            })),
          });
        }
        await tx.auditEntry.create({
          data: {
            organizationId,
            entityType: "COMPETITION_EVENT",
            entityId: eventId,
            action: "UPDATE",
            ...actor,
            metadata: { competitionId, section: "events" },
          },
        });
      });
      const competition = await findCompetition(organizationId, competitionId);
      return c.json({ competition: serializeCompetition(competition!) });
    },
  )
  .delete(
    "/:organizationId/competitions/:competitionId/events/:eventId",
    zValidator("param", CompetitionIdParams$.extend({ eventId: z.uuid() })),
    zValidator("json", CompetitionMutationVersion$),
    hasOrganizationCompetitionPermission("update"),
    async (c) => {
      const { organizationId, competitionId, eventId } = c.req.valid("param");
      const { expectedUpdatedAt } = c.req.valid("json");
      const actor = auditActor(c);
      await prisma.$transaction(async (tx) => {
        await assertDraftVersion(tx, {
          organizationId,
          competitionId,
          expectedUpdatedAt,
          actorUserId: actor.actorUserId,
        });
        const result = await tx.competitionEvent.deleteMany({
          where: { id: eventId, competitionId },
        });
        if (!result.count) throw new CompetitionRouteError(404, "Competition Event not found");
        await tx.auditEntry.create({
          data: {
            organizationId,
            entityType: "COMPETITION_EVENT",
            entityId: eventId,
            action: "DELETE",
            reason: "Removed while configuring Draft",
            ...actor,
            metadata: { competitionId, section: "events" },
          },
        });
      });
      const competition = await findCompetition(organizationId, competitionId);
      return c.json({ competition: serializeCompetition(competition!) });
    },
  )
  .post(
    "/:organizationId/competitions/:competitionId/publish",
    zValidator("param", CompetitionIdParams$),
    zValidator("json", PublishCompetition$),
    hasOrganizationCompetitionPermission("publish"),
    async (c) => {
      const { organizationId, competitionId } = c.req.valid("param");
      const { expectedUpdatedAt } = c.req.valid("json");
      const actor = auditActor(c);
      const current = await findCompetition(organizationId, competitionId);
      if (!current) return c.json({ error: "Competition not found" }, 404);
      const readiness = getReadiness(current);
      if (!readiness.ready) {
        return c.json({ error: "Competition is not ready to publish", readiness }, 400);
      }
      await prisma.$transaction(async (tx) => {
        await assertDraftVersion(tx, {
          organizationId,
          competitionId,
          expectedUpdatedAt,
          actorUserId: actor.actorUserId,
        });
        await tx.competition.update({
          where: { id: competitionId },
          data: { lifecycleState: "PUBLISHED", publishedAt: new Date() },
        });
        await tx.auditEntry.create({
          data: {
            organizationId,
            entityType: "COMPETITION",
            entityId: competitionId,
            action: "STATE_TRANSITION",
            ...actor,
            metadata: { from: "DRAFT", to: "PUBLISHED" },
          },
        });
      });
      const competition = await findCompetition(organizationId, competitionId);
      return c.json({ competition: serializeCompetition(competition!) });
    },
  )
  .delete(
    "/:organizationId/competitions/:competitionId",
    zValidator("param", CompetitionIdParams$),
    zValidator("json", DeleteDraftCompetition$),
    hasOrganizationCompetitionPermission("delete-draft"),
    async (c) => {
      const { organizationId, competitionId } = c.req.valid("param");
      const { expectedUpdatedAt, reason } = c.req.valid("json");
      const actor = auditActor(c);
      const current = await findCompetition(organizationId, competitionId);
      if (!current) return c.json({ error: "Competition not found" }, 404);
      const deletedName = primaryName(current);
      await prisma.$transaction(async (tx) => {
        await assertDraftVersion(tx, {
          organizationId,
          competitionId,
          expectedUpdatedAt,
          actorUserId: actor.actorUserId,
        });
        const registrationCount = await tx.athleteRegistration.count({ where: { competitionId } });
        if (registrationCount) {
          throw new CompetitionRouteError(409, "A Draft with registrations cannot be deleted");
        }
        await tx.auditEntry.create({
          data: {
            organizationId,
            entityType: "COMPETITION",
            entityId: competitionId,
            action: "DELETE",
            reason,
            ...actor,
            metadata: { name: deletedName },
          },
        });
        await tx.competition.delete({ where: { id: competitionId } });
      });
      return c.json({ deleted: true });
    },
  );

function eventCreateData(
  competitionId: string,
  input: z.infer<typeof UpsertCompetitionEvent$>,
): Prisma.CompetitionEventCreateInput {
  return {
    competition: { connect: { id: competitionId } },
    discipline: { connect: { id: input.disciplineId } },
    kind: input.kind,
    relayLegCount: input.kind === "RELAY" ? input.relayLegCount : null,
    resultEntryMode: input.resultEntryMode,
    registerable: input.registerable,
    capacity: input.capacity,
    translations: { create: input.translations },
    eligibility: {
      create: input.athleteCategoryIds.map((athleteCategoryId) => ({
        athleteCategory: { connect: { id: athleteCategoryId } },
      })),
    },
    rounds: {
      create: input.rounds.map((round, index) => ({
        sequence: index + 1,
        label: round.label,
        scheduledStartAt: round.scheduledStartAt,
        startGroups: {
          create: round.startGroups.map((group, groupIndex) => ({
            sequence: groupIndex + 1,
            label: group.label,
            scheduledStartAt: group.scheduledStartAt,
          })),
        },
      })),
    },
  };
}
