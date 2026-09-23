import { zValidator } from "@hono/zod-validator";
import { CompetitionIdParams$, DeleteDraftCompetition$, PublishCompetition$ } from "@repo/utils";
import { Hono } from "hono";

import { prisma } from "@/lib/prisma";
import { hasOrganizationCompetitionPermission } from "@/middlewares/use-organization-permission";

import {
  assertDraftVersion,
  auditActor,
  CompetitionRouteError,
  findCompetition,
  getReadiness,
  primaryName,
  serializeCompetition,
} from "./shared";

export const lifecycleRoutes = new Hono()
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
