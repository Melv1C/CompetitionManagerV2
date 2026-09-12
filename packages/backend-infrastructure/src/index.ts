import { Pool } from "pg";
import { createClient, type RedisClientType } from "redis";

export type InfrastructureConnections = {
  database?: Pool;
  redis: RedisClientType;
};

export function createInfrastructureConnections(
  databaseUrl: string | undefined,
  redisUrl: string,
): InfrastructureConnections {
  return {
    database: databaseUrl ? new Pool({ connectionString: databaseUrl, max: 5 }) : undefined,
    redis: createClient({ url: redisUrl }),
  };
}

export async function probeDatabase(pool: Pool | undefined): Promise<boolean> {
  if (!pool) {
    return false;
  }
  const result = await pool.query<{ ok: number }>("SELECT 1 AS ok");
  return result.rows[0]?.ok === 1;
}

export async function probeRedis(client: RedisClientType): Promise<boolean> {
  if (!client.isOpen) {
    await client.connect();
  }
  return (await client.ping()) === "PONG";
}

export async function closeInfrastructureConnections(
  connections: InfrastructureConnections,
): Promise<void> {
  await Promise.all([
    connections.database?.end() ?? Promise.resolve(),
    connections.redis.isOpen ? connections.redis.quit() : Promise.resolve(),
  ]);
}
