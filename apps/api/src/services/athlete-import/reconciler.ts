import { getApiJobProducer } from "@/lib/job-producer";
import { logger } from "@/lib/logger";

import { athleteImportService } from "./service";

const DEFAULT_INTERVAL_MS = 30_000;

interface AthleteImportReconcilerConfiguration {
  intervalMs?: number;
  service?: Pick<typeof athleteImportService, "reconcileQueuedImports">;
  producer?: Pick<ReturnType<typeof getApiJobProducer>, "athleteImport">;
  log?: Pick<typeof logger, "error">;
}

export function createAthleteImportReconciler({
  intervalMs = DEFAULT_INTERVAL_MS,
  service = athleteImportService,
  producer = getApiJobProducer(),
  log = logger,
}: AthleteImportReconcilerConfiguration = {}) {
  let timer: ReturnType<typeof setInterval> | undefined;
  let running = false;

  async function reconcile() {
    if (running) return;
    running = true;
    try {
      const result = await service.reconcileQueuedImports((batchId, jobId) =>
        producer.athleteImport(batchId, jobId),
      );
      for (const { batchId, error } of result.errors) {
        log.error(`Could not dispatch queued athlete import ${batchId}`, {
          metadata: { error },
        });
      }
    } catch (error) {
      log.error("Could not reconcile queued athlete imports", { metadata: { error } });
    } finally {
      running = false;
    }
  }

  return {
    start() {
      if (timer) return;
      void reconcile();
      timer = setInterval(() => void reconcile(), intervalMs);
    },
    stop() {
      if (!timer) return;
      clearInterval(timer);
      timer = undefined;
    },
  };
}
