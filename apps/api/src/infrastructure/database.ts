import { PrismaClient } from "@prisma/client";

const defaultDatabaseUrl =
  "postgresql://competition:competition@localhost:5432/competition_manager";

export function createDatabaseClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
}

export const database = createDatabaseClient(process.env.DATABASE_URL ?? defaultDatabaseUrl);

export async function probeDatabase(database: PrismaClient): Promise<boolean> {
  await database.$queryRaw`SELECT 1`;
  return true;
}
