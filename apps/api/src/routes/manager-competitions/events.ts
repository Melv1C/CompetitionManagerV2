import { zValidator } from "@hono/zod-validator";
import {
  CompetitionIdParams$,
  CompetitionMutationVersion$,
  UpsertCompetitionEvent$,
} from "@repo/utils";
import { Hono } from "hono";
import * as z from "zod";

import { prisma, type Prisma } from "@/lib/prisma";
import { hasOrganizationCompetitionPermission } from "@/middlewares/use-organization-permission";

import {
  assertDraftVersion,
  assertEventCatalogReferences,
  auditActor,
  CompetitionRouteError,
  findCompetition,
  serializeCompetition,
} from "./shared";

export const eventRoutes = new Hono()
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
