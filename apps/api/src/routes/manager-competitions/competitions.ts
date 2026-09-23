import { zValidator } from "@hono/zod-validator";
import {
  CompetitionIdParams$,
  CreateCompetition$,
  OrganizationIdParams$,
  UpdateCompetitionDetails$,
  UpdateCompetitionPricing$,
} from "@repo/utils";
import { Hono } from "hono";

import { prisma } from "@/lib/prisma";
import { hasOrganizationCompetitionPermission } from "@/middlewares/use-organization-permission";

import {
  assertDraftVersion,
  auditActor,
  findCompetition,
  primaryName,
  serializeCompetition,
} from "./shared";

export const competitionRoutes = new Hono()
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
  );
