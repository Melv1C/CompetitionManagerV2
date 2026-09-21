import "varlock/auto-load";
import { ENV } from "varlock/env";

import { createAthleteImportProcessor } from "./athlete-import-processor";
import { createWorkerConsumer } from "./job-consumer";
import { startWorkerLifecycle } from "./worker-lifecycle";

const logger = {
  info: (message: string) => console.info(message),
  error: (message: string, error: Error) => console.error(message, error),
};

const athleteImportProcessor = createAthleteImportProcessor({ databaseUrl: ENV.DATABASE_URL });
athleteImportProcessor.startCleanup((error) =>
  logger.error("Athlete import cleanup failed", error),
);
const queueWorker = createWorkerConsumer({
  redisUrl: ENV.REDIS_URL,
  logger,
  processAthleteImport: (importBatchId, attemptsMade) =>
    athleteImportProcessor.process(importBatchId, attemptsMade),
});
const worker = {
  waitUntilReady: () => queueWorker.waitUntilReady(),
  async close() {
    await queueWorker.close();
    await athleteImportProcessor.close();
  },
};

await startWorkerLifecycle({ worker, logger });
