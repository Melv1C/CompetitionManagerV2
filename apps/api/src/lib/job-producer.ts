import {
  createApplicationJobQueue,
  applicationJobNames,
  type ApplicationJobQueue,
} from "@repo/jobs";
import { ENV } from "varlock/env";

interface ApiJobProducerConfiguration {
  queue?: ApplicationJobQueue;
  now?: () => Date;
}

export function createApiJobProducer({
  queue = createApplicationJobQueue({ redisUrl: ENV.REDIS_URL }),
  now = () => new Date(),
}: ApiJobProducerConfiguration = {}) {
  return {
    async serverReady() {
      return queue.enqueue(applicationJobNames.apiStarted, {
        startedAt: now().toISOString(),
      });
    },
    async athleteImport(importBatchId: string, jobId: string) {
      return queue.enqueue(
        applicationJobNames.athleteImport,
        { importBatchId },
        { attempts: 3, jobId },
      );
    },
    async close() {
      await queue.close();
    },
  };
}

let sharedProducer: ReturnType<typeof createApiJobProducer> | undefined;

export function getApiJobProducer() {
  sharedProducer ??= createApiJobProducer();
  return sharedProducer;
}
