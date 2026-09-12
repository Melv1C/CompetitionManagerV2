import { serve } from "@hono/node-server";

import { parseEnvironment } from "@competition-manager/config-env";

import {
  closeInfrastructureConnections,
  createInfrastructureConnections,
  probeDatabase,
  probeRedis,
} from "./infrastructure.js";
import { createHealthApp } from "./health.js";

const environment = parseEnvironment(Bun.env);
const connections = createInfrastructureConnections(
  environment.DATABASE_URL,
  environment.REDIS_URL,
);
const app = createHealthApp({
  database: () => probeDatabase(connections.database),
  redis: () => probeRedis(connections.redis),
});

const server = serve({
  fetch: app.fetch,
  port: environment.PORT,
});

console.log(JSON.stringify({ event: "api_started", port: environment.PORT }));

async function shutdown(signal: string): Promise<void> {
  console.log(JSON.stringify({ event: "api_shutdown", signal }));
  server.close();
  await closeInfrastructureConnections(connections);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
