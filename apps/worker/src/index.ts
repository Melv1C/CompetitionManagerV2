import {
  closeInfrastructureConnections,
  createInfrastructureConnections,
} from "@competition-manager/backend-infrastructure";
import { ENV } from "varlock/env";

import { workerHandlers } from "./handlers";

export async function startWorker(): Promise<void> {
  const connections = createInfrastructureConnections(ENV.DATABASE_URL, ENV.REDIS_URL);
  await connections.redis.connect();
  console.log(JSON.stringify({ event: "worker_started", queue_backend: "redis" }));

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(JSON.stringify({ event: "worker_shutdown", signal }));
    connections.queue.stop();
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  try {
    await connections.queue.run(workerHandlers);
  } finally {
    await closeInfrastructureConnections(connections);
  }
}

if (process.env.NODE_ENV !== "test") await startWorker();
