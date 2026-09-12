import { PrismaClient } from "@prisma/client";

export function createDatabaseClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
}

export async function probeDatabase(database: PrismaClient): Promise<boolean> {
  await database.$queryRaw`SELECT 1`;
  return true;
}
