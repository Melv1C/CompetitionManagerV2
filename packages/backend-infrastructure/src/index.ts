import { Pool } from "pg";
import { createClient, type RedisClientType } from "redis";

export type InfrastructureConnections = {
  database: Pool;
  redis: RedisClientType;
};

export function createInfrastructureConnections(
  databaseUrl: string,
  redisUrl: string,
): InfrastructureConnections {
  return {
    database: new Pool({ connectionString: databaseUrl, max: 5 }),
    redis: createClient({ url: redisUrl }),
  };
}

export async function probeDatabase(pool: Pool): Promise<boolean> {
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
    connections.database.end(),
    connections.redis.isOpen ? connections.redis.quit() : Promise.resolve(),
  ]);
}
