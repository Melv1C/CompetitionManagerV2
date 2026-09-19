import { zValidator } from "@hono/zod-validator";
import {
  CreateOrganization$,
  OrganizationOwnerCandidatesQuery$,
  OrganizationOwnerCandidatesResponse$,
  OrganizationResponse$,
  OrganizationsResponse$,
} from "@repo/utils";
import { Hono } from "hono";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/middlewares/use-auth";

function isOrganizationSlugConflict(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    code?: unknown;
    body?: { code?: unknown };
  };

  return candidate.code === "P2002" || candidate.body?.code === "ORGANIZATION_ALREADY_EXISTS";
}

export const organizationsRoutes = new Hono()
  .use("*", isAdmin)
  .get("/owner-candidates", zValidator("query", OrganizationOwnerCandidatesQuery$), async (c) => {
    const { search } = c.req.valid("query");
    const users = await prisma.user.findMany({
      where: {
        role: "user",
        emailVerified: true,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      take: 25,
      select: { id: true, name: true, email: true },
    });

    return c.json(OrganizationOwnerCandidatesResponse$.parse({ users }));
  })
  .get("/", async (c) => {
    const records = await prisma.organization.findMany({
      orderBy: { name: "asc" },
      include: {
        members: {
          where: { role: "owner" },
          take: 1,
          select: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    const organizations = records.map((record) => {
      const owner = record.members[0]?.user;
      if (!owner) {
        throw new Error(`Organization ${record.id} has no owner`);
      }

      return {
        id: record.id,
        name: record.name,
        slug: record.slug,
        logo: record.logo,
        createdAt: record.createdAt,
        owner,
      };
    });

    return c.json(OrganizationsResponse$.parse({ organizations }));
  })
  .post("/", zValidator("json", CreateOrganization$), async (c) => {
    const { name, slug, logo, ownerId } = c.req.valid("json");
    const [owner, existingOrganization] = await Promise.all([
      prisma.user.findUnique({
        where: { id: ownerId },
        select: { id: true, name: true, email: true, emailVerified: true, role: true },
      }),
      prisma.organization.findUnique({
        where: { slug },
        select: { id: true },
      }),
    ]);

    if (!owner) {
      return c.json({ error: "Selected owner was not found" }, 404);
    }

    if (owner.role === "admin") {
      return c.json({ error: "Platform administrators cannot own organizations" }, 400);
    }

    if (!owner.emailVerified) {
      return c.json({ error: "Organization owners must have a verified email" }, 400);
    }

    if (existingOrganization) {
      return c.json({ error: "An organization with this slug already exists" }, 409);
    }

    try {
      const organization = await auth.api.createOrganization({
        body: { name, slug, logo, userId: owner.id },
      });

      return c.json(
        OrganizationResponse$.parse({
          organization: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            logo: organization.logo ?? null,
            createdAt: organization.createdAt,
            owner: {
              id: owner.id,
              name: owner.name,
              email: owner.email,
            },
          },
        }),
        201,
      );
    } catch (error) {
      if (isOrganizationSlugConflict(error)) {
        return c.json({ error: "An organization with this slug already exists" }, 409);
      }

      throw error;
    }
  });
