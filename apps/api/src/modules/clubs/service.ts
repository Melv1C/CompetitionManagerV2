import { createHash } from "node:crypto";

import {
  clubCreateRequestSchema,
  type ClubCreateRequest,
  type ClubListResponse,
  type ClubResponse,
} from "@competition-manager/contracts";
import { Prisma, PrismaClient } from "@prisma/client";

import { ApiConflictError, ApiResourceNotFoundError } from "../../errors";

type ClubDatabase = Pick<
  PrismaClient,
  "$transaction" | "club" | "clubMembership" | "clubCreationIdempotency"
>;

function responseFromRecords(input: {
  club: { id: string; name: string; createdAt: Date; updatedAt: Date };
  membership: { id: string; clubId: string; userId: string; role: string; createdAt: Date };
}): ClubResponse {
  return {
    club: {
      id: input.club.id,
      name: input.club.name,
      createdAt: input.club.createdAt.toISOString(),
      updatedAt: input.club.updatedAt.toISOString(),
    },
    membership: {
      id: input.membership.id,
      clubId: input.membership.clubId,
      userId: input.membership.userId,
      role: "manager",
      createdAt: input.membership.createdAt.toISOString(),
    },
  };
}

function requestHash(input: ClubCreateRequest): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export type ClubService = {
  listForUser(userId: string): Promise<ClubListResponse>;
  getForUser(userId: string, clubId: string): Promise<ClubResponse>;
  createForUser(
    userId: string,
    input: ClubCreateRequest,
    idempotencyKey: string,
  ): Promise<ClubResponse>;
};

export function createClubService(database: ClubDatabase): ClubService {
  async function existingResult(userId: string, idempotencyKey: string, hash: string) {
    const existing = await database.clubCreationIdempotency.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      include: { club: true },
    });
    if (!existing) return null;
    if (existing.requestHash !== hash) {
      throw new ApiConflictError(
        "IDEMPOTENCY_KEY_REUSED",
        "This idempotency key was already used for a different Club request",
      );
    }
    const membership = await database.clubMembership.findUnique({
      where: { clubId_userId: { clubId: existing.clubId, userId } },
    });
    if (!membership) return null;
    return responseFromRecords({ club: existing.club, membership });
  }

  return {
    async listForUser(userId) {
      const memberships = await database.clubMembership.findMany({
        where: { userId },
        include: { club: true },
        orderBy: { createdAt: "asc" },
      });
      return {
        clubs: memberships.map(({ club, ...membership }) =>
          responseFromRecords({ club, membership }),
        ),
      };
    },

    async getForUser(userId, clubId) {
      const membership = await database.clubMembership.findUnique({
        where: { clubId_userId: { clubId, userId } },
        include: { club: true },
      });
      if (!membership) {
        throw new ApiResourceNotFoundError("CLUB_NOT_FOUND", "Club not found");
      }
      const { club, ...membershipRecord } = membership;
      return responseFromRecords({ club, membership: membershipRecord });
    },

    async createForUser(userId, rawInput, idempotencyKey) {
      const input = clubCreateRequestSchema.parse(rawInput);
      const hash = requestHash(input);
      const previous = await existingResult(userId, idempotencyKey, hash);
      if (previous) return previous;

      try {
        return await database.$transaction(async (transaction) => {
          const inTransaction = await transaction.clubCreationIdempotency.findUnique({
            where: { userId_idempotencyKey: { userId, idempotencyKey } },
            include: { club: true },
          });
          if (inTransaction) {
            if (inTransaction.requestHash !== hash) {
              throw new ApiConflictError(
                "IDEMPOTENCY_KEY_REUSED",
                "This idempotency key was already used for a different Club request",
              );
            }
            const membership = await transaction.clubMembership.findUnique({
              where: { clubId_userId: { clubId: inTransaction.clubId, userId } },
            });
            if (membership) return responseFromRecords({ club: inTransaction.club, membership });
          }

          const club = await transaction.club.create({ data: { name: input.name } });
          const membership = await transaction.clubMembership.create({
            data: { clubId: club.id, userId, role: "manager" },
          });
          await transaction.clubCreationIdempotency.create({
            data: {
              userId,
              idempotencyKey,
              requestHash: hash,
              clubId: club.id,
            },
          });
          return responseFromRecords({ club, membership });
        });
      } catch (error) {
        if (error instanceof ApiConflictError) throw error;
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const retried = await existingResult(userId, idempotencyKey, hash);
          if (retried) return retried;
        }
        throw error;
      }
    },
  };
}
