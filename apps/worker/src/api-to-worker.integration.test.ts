import { createApplicationJobQueue, type ApplicationJobQueue, type JobWorker } from "@repo/jobs";
import { afterEach, describe, expect, it } from "vitest";

import { createApiJobProducer } from "../../api/src/lib/job-producer";
import { createWorkerConsumer } from "./job-consumer";

const redisUrl = process.env.REDIS_URL;
const integration = redisUrl ? describe : describe.skip;

integration("API to worker jobs", () => {
  const resources: Array<ApplicationJobQueue | JobWorker> = [];

  afterEach(async () => {
    await Promise.all(resources.splice(0).map((resource) => resource.close()));
  });

  it("delivers the API-started job to the worker", async () => {
    const queue = createApplicationJobQueue({ redisUrl: redisUrl! });
    let resolveReceived: (message: string) => void;
    let rejectReceived: (error: Error) => void;
    const received = new Promise<string>((resolve, reject) => {
      resolveReceived = resolve;
      rejectReceived = reject;
    });
    const worker = createWorkerConsumer({
      redisUrl: redisUrl!,
      logger: {
        info: (message) => resolveReceived(message),
        error: (message, error) => rejectReceived(new Error(`${message}: ${error.message}`)),
      },
    });
    resources.push(queue, worker);
    await worker.waitUntilReady();

    const producer = createApiJobProducer({
      queue,
      now: () => new Date("2026-09-14T12:00:00.000Z"),
    });

    const jobId = await producer.serverReady();

    await expect(received).resolves.toBe(`Processed API-started job ${jobId}`);
  }, 15_000);
});
