import { createHash } from "node:crypto";

import {
  eligibleUserListResponseSchema,
  organizationCreateRequestSchema,
  type EligibleUserListResponse,
  type OrganizationCreateRequest,
  type OrganizationListResponse,
  type OrganizationResponse,
} from "@competition-manager/contracts";
import { Prisma, PrismaClient } from "@prisma/client";

import { ApiConflictError, ApiResourceNotFoundError } from "../../errors";

type OrganizationDatabase = Pick<
  PrismaClient,
  "$transaction" | "user" | "organization" | "member" | "organizationCreationIdempotency"
>;

function responseFromRecords(input: {
  organization: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
  };
  membership: { id: string; organizationId: string; userId: string; role: string; createdAt: Date };
}): OrganizationResponse {
  return {
    organization: {
      id: input.organization.id,
      name: input.organization.name,
      slug: input.organization.slug,
      createdAt: input.organization.createdAt.toISOString(),
      updatedAt: input.organization.updatedAt.toISOString(),
    },
    membership: {
      id: input.membership.id,
      organizationId: input.membership.organizationId,
      userId: input.membership.userId,
      role: "owner",
      createdAt: input.membership.createdAt.toISOString(),
    },
  };
}

function requestHash(input: OrganizationCreateRequest): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function ownerNotFound(): never {
  throw new ApiResourceNotFoundError("OWNER_NOT_FOUND", "Owner user not found");
}

export type OrganizationService = {
  listEligibleUsers(query: string): Promise<EligibleUserListResponse>;
  listForUser(userId: string): Promise<OrganizationListResponse>;
  getForUser(userId: string, organizationId: string): Promise<OrganizationResponse>;
  createForAdmin(
    adminUserId: string,
    input: OrganizationCreateRequest,
    idempotencyKey: string,
  ): Promise<OrganizationResponse>;
};

export function createOrganizationService(database: OrganizationDatabase): OrganizationService {
  async function existingResult(adminUserId: string, idempotencyKey: string, hash: string) {
    const existing = await database.organizationCreationIdempotency.findUnique({
      where: { adminUserId_idempotencyKey: { adminUserId, idempotencyKey } },
      include: { organization: true },
    });
    if (!existing) return null;
    if (existing.requestHash !== hash) {
      throw new ApiConflictError(
        "IDEMPOTENCY_KEY_REUSED",
        "This idempotency key was already used for a different Organization request",
      );
    }
    const owner = await database.member.findFirst({
      where: { organizationId: existing.organizationId, role: "owner" },
    });
    if (!owner) return null;
    return responseFromRecords({ organization: existing.organization, membership: owner });
  }

  return {
    async listEligibleUsers(query) {
      const normalizedQuery = query.trim();
      const users = await database.user.findMany({
        where: {
          emailVerified: true,
          banned: false,
          ...(normalizedQuery
            ? {
                OR: [
                  { email: { contains: normalizedQuery, mode: "insensitive" } },
                  { name: { contains: normalizedQuery, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        select: { id: true, name: true, email: true, emailVerified: true },
        orderBy: [{ name: "asc" }, { email: "asc" }],
        take: 20,
      });
      return eligibleUserListResponseSchema.parse({ users });
    },

    async listForUser(userId) {
      const memberships = await database.member.findMany({
        where: { userId, role: "owner" },
        include: { organization: true },
        orderBy: { createdAt: "asc" },
      });
      return {
        organizations: memberships.map(({ organization, ...membership }) =>
          responseFromRecords({ organization, membership }),
        ),
      };
    },

    async getForUser(userId, organizationId) {
      const membership = await database.member.findUnique({
        where: { organizationId_userId: { organizationId, userId }, role: "owner" },
        include: { organization: true },
      });
      if (!membership) {
        throw new ApiResourceNotFoundError("ORGANIZATION_NOT_FOUND", "Organization not found");
      }
      const { organization, ...membershipRecord } = membership;
      return responseFromRecords({ organization, membership: membershipRecord });
    },

    async createForAdmin(adminUserId, rawInput, idempotencyKey) {
      const input = organizationCreateRequestSchema.parse(rawInput);
      const hash = requestHash(input);
      const previous = await existingResult(adminUserId, idempotencyKey, hash);
      if (previous) return previous;

      try {
        return await database.$transaction(async (transaction) => {
          const inTransaction = await transaction.organizationCreationIdempotency.findUnique({
            where: { adminUserId_idempotencyKey: { adminUserId, idempotencyKey } },
            include: { organization: true },
          });
          if (inTransaction) {
            if (inTransaction.requestHash !== hash) {
              throw new ApiConflictError(
                "IDEMPOTENCY_KEY_REUSED",
                "This idempotency key was already used for a different Organization request",
              );
            }
            const owner = await transaction.member.findFirst({
              where: { organizationId: inTransaction.organizationId, role: "owner" },
            });
            if (owner) {
              return responseFromRecords({
                organization: inTransaction.organization,
                membership: owner,
              });
            }
          }

          const owner = await transaction.user.findFirst({
            where: { id: input.ownerUserId, emailVerified: true, banned: false },
          });
          if (!owner) ownerNotFound();

          const slugTaken = await transaction.organization.findUnique({
            where: { slug: input.slug },
          });
          if (slugTaken) {
            throw new ApiConflictError(
              "ORGANIZATION_SLUG_TAKEN",
              "Organization slug is already in use",
            );
          }

          const organization = await transaction.organization.create({
            data: { name: input.name, slug: input.slug },
          });
          const membership = await transaction.member.create({
            data: {
              id: crypto.randomUUID(),
              organizationId: organization.id,
              userId: owner.id,
              role: "owner",
              createdAt: new Date(),
            },
          });
          await transaction.organizationCreationIdempotency.create({
            data: {
              adminUserId,
              idempotencyKey,
              requestHash: hash,
              organizationId: organization.id,
            },
          });
          return responseFromRecords({ organization, membership });
        });
      } catch (error) {
        if (error instanceof ApiConflictError || error instanceof ApiResourceNotFoundError)
          throw error;
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const retried = await existingResult(adminUserId, idempotencyKey, hash);
          if (retried) return retried;
          throw new ApiConflictError(
            "ORGANIZATION_SLUG_TAKEN",
            "Organization slug is already in use",
          );
        }
        throw error;
      }
    },
  };
}
