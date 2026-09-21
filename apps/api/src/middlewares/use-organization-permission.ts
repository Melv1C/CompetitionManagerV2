import type { CompetitionPermission } from "@repo/utils";
import type { Context, Next } from "hono";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export function hasOrganizationCompetitionPermission(permission: CompetitionPermission) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }
    if (!user.emailVerified) {
      return c.json({ error: "Email verification required" }, 403);
    }

    const organizationId = c.req.param("organizationId");
    const membership = await prisma.member.findFirst({
      where: { organizationId, userId: user.id },
      select: { id: true },
    });
    if (!membership) {
      return c.json({ error: "Organization not found" }, 404);
    }

    const allowed = await auth.api.hasPermission({
      headers: c.req.raw.headers,
      body: {
        organizationId,
        permissions: { competition: [permission] },
      },
    });
    if (!allowed.success) {
      return c.json({ error: "Competition permission required" }, 403);
    }

    await next();
  };
}
