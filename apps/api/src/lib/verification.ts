import { createHash } from "node:crypto";

import type { PrismaClient } from "@prisma/client";

const identifierPrefix = "competition-manager:email-verification:";

export type VerificationTokenStore = {
  issue(email: string, token: string, expiresAt: Date): Promise<void>;
  consume(token: string): Promise<boolean>;
};

function identifier(email: string): string {
  return `${identifierPrefix}${email.toLowerCase()}`;
}

function digest(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

export function createDatabaseVerificationTokenStore(
  database: PrismaClient,
): VerificationTokenStore {
  return {
    async issue(email, token, expiresAt) {
      await database.verification.deleteMany({ where: { identifier: identifier(email) } });
      await database.verification.create({
        data: {
          identifier: identifier(email),
          value: digest(token),
          expiresAt,
        },
      });
    },
    async consume(token) {
      const result = await database.verification.deleteMany({
        where: {
          value: digest(token),
          identifier: { startsWith: identifierPrefix },
          expiresAt: { gt: new Date() },
        },
      });
      await database.verification.deleteMany({
        where: { identifier: { startsWith: identifierPrefix }, expiresAt: { lte: new Date() } },
      });
      return result.count === 1;
    },
  };
}

export function createInMemoryVerificationTokenStore(): VerificationTokenStore {
  const tokens = new Map<string, { value: string; expiresAt: Date }>();
  return {
    async issue(email, token, expiresAt) {
      tokens.set(email.toLowerCase(), { value: digest(token), expiresAt });
    },
    async consume(token) {
      for (const [key, record] of tokens) {
        if (record.expiresAt <= new Date()) {
          tokens.delete(key);
          continue;
        }
        if (record.value === digest(token)) {
          tokens.delete(key);
          return true;
        }
      }
      return false;
    },
  };
}
