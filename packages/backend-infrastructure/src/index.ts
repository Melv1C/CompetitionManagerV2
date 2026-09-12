import { Pool } from "pg";
import { createClient } from "redis";

import { createRedisJobQueue, type RedisJobQueue } from "./jobs";

export type InfrastructureConnections = {
  database?: Pool;
  redis: ReturnType<typeof createClient>;
  queue: RedisJobQueue;
};

export * from "./jobs";

export function createInfrastructureConnections(
  databaseUrl: string | undefined,
  redisUrl: string,
): InfrastructureConnections {
  const redis = createClient({ url: redisUrl });
  return {
    database: databaseUrl ? new Pool({ connectionString: databaseUrl, max: 5 }) : undefined,
    redis,
    queue: createRedisJobQueue(redis),
  };
}

export async function probeDatabase(pool: Pool | undefined): Promise<boolean> {
  if (!pool) {
    return false;
  }
  const result = await pool.query<{ ok: number }>("SELECT 1 AS ok");
  return result.rows[0]?.ok === 1;
}

export async function probeRedis(client: ReturnType<typeof createClient>): Promise<boolean> {
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

export * from "./jobs";
