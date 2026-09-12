import { serve } from "@hono/node-server";
import { ENV } from "varlock/env";

import { createHealthApp } from "./health.js";
import {
  closeInfrastructureConnections,
  createInfrastructureConnections,
  probeDatabase,
  probeRedis,
} from "./infrastructure.js";

const connections = createInfrastructureConnections(ENV.DATABASE_URL, ENV.REDIS_URL);
const app = createHealthApp({
  database: () => probeDatabase(connections.database),
  redis: () => probeRedis(connections.redis),
});

const server = serve({
  fetch: app.fetch,
  port: ENV.BACKEND_PORT,
});

console.log(JSON.stringify({ event: "api_started", port: ENV.BACKEND_PORT }));

async function shutdown(signal: string): Promise<void> {
  console.log(JSON.stringify({ event: "api_shutdown", signal }));
  server.close();
  await closeInfrastructureConnections(connections);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
