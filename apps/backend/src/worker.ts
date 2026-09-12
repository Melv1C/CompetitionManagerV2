import { ENV } from "varlock/env";

import {
  closeInfrastructureConnections,
  createInfrastructureConnections,
} from "./infrastructure.js";

const connections = createInfrastructureConnections(ENV.DATABASE_URL, ENV.REDIS_URL);

await connections.redis.connect();
console.log(JSON.stringify({ event: "worker_started", queue_backend: "redis" }));

async function shutdown(signal: string): Promise<void> {
  console.log(JSON.stringify({ event: "worker_shutdown", signal }));
  await closeInfrastructureConnections(connections);
  process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
