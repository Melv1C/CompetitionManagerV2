import { zValidator } from "@hono/zod-validator";
import { CreateOrganizationDiscipline$, OrganizationIdParams$ } from "@repo/utils";
import { Hono } from "hono";

import { prisma } from "@/lib/prisma";
import { hasOrganizationCompetitionPermission } from "@/middlewares/use-organization-permission";

export const catalogueRoutes = new Hono()
  .get(
    "/:organizationId/catalog",
    zValidator("param", OrganizationIdParams$),
    hasOrganizationCompetitionPermission("create"),
    async (c) => {
      const { organizationId } = c.req.valid("param");
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
  .post(
    "/:organizationId/catalog/disciplines",
    zValidator("param", OrganizationIdParams$),
    zValidator("json", CreateOrganizationDiscipline$),
    hasOrganizationCompetitionPermission("create"),
    async (c) => {
      const { organizationId } = c.req.valid("param");
      const { code, measurement, translations } = c.req.valid("json");
      const duplicate = await prisma.discipline.findFirst({
        where: { code, OR: [{ organizationId: null }, { organizationId }] },
        select: { id: true },
      });
      if (duplicate) return c.json({ error: "Discipline code is already available" }, 409);
      try {
        const discipline = await prisma.discipline.create({
          data: { organizationId, code, measurement, translations: { create: translations } },
          include: { translations: true },
        });
        return c.json({ discipline }, 201);
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
          return c.json({ error: "Discipline code is already available" }, 409);
        }
        throw error;
      }
    },
  );
