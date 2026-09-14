import { prisma } from "@/lib/prisma";

import type { OrganizationRepository } from "./organizations";

export const organizationRepository: OrganizationRepository = {
  ownerExists: async (userId) => Boolean(await prisma.user.findUnique({ where: { id: userId } })),
  create: (input) => prisma.organization.create({ data: input }),
  findById: (id) => prisma.organization.findUnique({ where: { id } }),
};
