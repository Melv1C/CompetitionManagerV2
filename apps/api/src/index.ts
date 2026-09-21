import type { Server as HTTPServer } from "node:http";

import { serve } from "@hono/node-server";
import { prometheus } from "@hono/prometheus";
import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import "varlock/auto-load";
import { ENV } from "varlock/env";

import { createApiShutdown, registerApiShutdown } from "@/lib/api-shutdown";
import { getApiJobProducer } from "@/lib/job-producer";
import { logger } from "@/lib/logger";
import { initializeSocketIO } from "@/lib/socket";
import { routes } from "@/routes";
import { createAthleteImportReconciler } from "@/services/athlete-import/reconciler";

const { printMetrics, registerMetrics } = prometheus();
const jobProducer = getApiJobProducer();
const athleteImportReconciler = createAthleteImportReconciler({ producer: jobProducer });

const app = new Hono()
  .use(
    cors({
      origin: [ENV.FRONTEND_URL, ENV.ADMIN_URL, ENV.MANAGER_URL],
      credentials: true,
    }),
  )
  .use(contextStorage())
  .use(requestId())
  .use("*", registerMetrics)
  .get("/metrics", printMetrics)
  .route("/api", routes);

export type AppType = typeof app;

const httpServer = serve(
  {
    fetch: app.fetch,
    port: ENV.API_PORT,
  },
  (info) => {
    logger.info(`🚀 API server running on port ${info.port}`);
    void jobProducer.serverReady().catch((error) => {
      logger.error("Could not enqueue API-started job", { metadata: { error } });
    });
    athleteImportReconciler.start();
  },
);

// Initialize Socket.IO with the HTTP server
initializeSocketIO(httpServer as HTTPServer);

const closeApi = createApiShutdown({ jobProducer, httpServer });
const shutdown = async () => {
  athleteImportReconciler.stop();
  await closeApi();
};

registerApiShutdown({
  shutdown,
  logger: {
    error(message, error) {
      logger.error(message, { metadata: { error } });
    },
  },
});
