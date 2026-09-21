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
import { athleteImportService } from "@/services/athlete-import/service";

const { printMetrics, registerMetrics } = prometheus();
const jobProducer = getApiJobProducer();
const ATHLETE_IMPORT_RECONCILIATION_INTERVAL_MS = 30_000;
let athleteImportReconciliationTimer: ReturnType<typeof setInterval> | undefined;
let athleteImportReconciliationRunning = false;

async function reconcileQueuedAthleteImports() {
  if (athleteImportReconciliationRunning) return;
  athleteImportReconciliationRunning = true;
  try {
    const result = await athleteImportService.reconcileQueuedImports((batchId, jobId) =>
      jobProducer.athleteImport(batchId, jobId),
    );
    for (const { batchId, error } of result.errors) {
      logger.error(`Could not dispatch queued athlete import ${batchId}`, {
        metadata: { error },
      });
    }
  } catch (error) {
    logger.error("Could not reconcile queued athlete imports", { metadata: { error } });
  } finally {
    athleteImportReconciliationRunning = false;
  }
}

function startAthleteImportReconciliation() {
  void reconcileQueuedAthleteImports();
  athleteImportReconciliationTimer = setInterval(
    () => void reconcileQueuedAthleteImports(),
    ATHLETE_IMPORT_RECONCILIATION_INTERVAL_MS,
  );
}

function stopAthleteImportReconciliation() {
  if (athleteImportReconciliationTimer) clearInterval(athleteImportReconciliationTimer);
}

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
    startAthleteImportReconciliation();
  },
);

// Initialize Socket.IO with the HTTP server
initializeSocketIO(httpServer as HTTPServer);

const closeApi = createApiShutdown({ jobProducer, httpServer });
const shutdown = async () => {
  stopAthleteImportReconciliation();
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
