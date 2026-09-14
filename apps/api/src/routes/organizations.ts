import { type User } from "@repo/utils";
import { Hono } from "hono";
import * as z from "zod";

const CreateOrganization$ = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80),
  ownerId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{32}$/),
});

export type Organization = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
};

export type OrganizationRepository = {
  ownerExists: (userId: string) => Promise<boolean>;
  create: (input: Omit<Organization, "id">) => Promise<Organization>;
  findById: (id: string) => Promise<Organization | null>;
};

function unauthenticated() {
  return { error: "Authentication required" };
}

export function createOrganizationRoutes(repository: OrganizationRepository) {
  return new Hono<{ Variables: { user: User | null } }>()
    .post("/", async (c) => {
      const user = c.get("user") as User | null;
      if (!user) {
        return c.json(unauthenticated(), 401);
      }
      if (user.role !== "admin") {
        return c.json({ error: "Platform administrator required" }, 403);
      }

      const input = CreateOrganization$.safeParse(await c.req.json());
      if (!input.success) {
        return c.json({ error: "Invalid organization input" }, 400);
      }
      if (!(await repository.ownerExists(input.data.ownerId))) {
        return c.json({ error: "Organization owner does not exist" }, 400);
      }

      const organization = await repository.create(input.data);
      return c.json(organization, 201);
    })
    .get("/:organizationId/dashboard", async (c) => {
      const user = c.get("user") as User | null;
      if (!user) {
        return c.json(unauthenticated(), 401);
      }

      const organization = await repository.findById(c.req.param("organizationId"));
      if (!organization) {
        return c.json({ error: "Organization not found" }, 404);
      }
      if (organization.ownerId !== user.id) {
        return c.json({ error: "Organization owner required" }, 403);
      }

      return c.json(organization);
    });
}
