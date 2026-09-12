import {
  closeInfrastructureConnections,
  createInfrastructureConnections,
  probeRedis,
} from "@competition-manager/backend-infrastructure";
import { createQueuedVerificationEmailSender } from "@competition-manager/email";
import { serve } from "@hono/node-server";
import { ENV } from "varlock/env";

import { createApiApp } from "./app";
import { database, probeDatabase } from "./infrastructure/database";

const connections = createInfrastructureConnections(undefined, ENV.REDIS_URL);
const verificationEmailSender = createQueuedVerificationEmailSender({
  queue: {
    async enqueue(job) {
      await connections.queue.enqueue({
        name: job.name,
        schemaVersion: job.schemaVersion,
        payload: job.payload,
        businessKey: job.businessKey,
      });
    },
  },
});
const app = createApiApp({
  verificationEmailSender,
  database: () => probeDatabase(database),
  redis: () => probeRedis(connections.redis),
  queue: () =>
    connections.queue.health().catch(() => ({ available: false, depth: 0, failedJobs: 0 })),
});

const server = serve({
  fetch: app.fetch,
  port: ENV.BACKEND_PORT,
});

console.log(JSON.stringify({ event: "api_started", port: ENV.BACKEND_PORT }));

async function shutdown(signal: string): Promise<void> {
  console.log(JSON.stringify({ event: "api_shutdown", signal }));
  server.close();
  await database.$disconnect();
  await closeInfrastructureConnections(connections);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
