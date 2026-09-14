import { randomUUID } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import { createJobQueue, createJobWorker, type JobQueue, type JobWorker } from "./job-queue";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is required for job queue integration tests");
}

describe("job queue", () => {
  const queues: Pick<JobQueue, "close">[] = [];
  const workers: JobWorker[] = [];

  afterEach(async () => {
    await Promise.all(workers.splice(0).map((worker) => worker.close()));
    await Promise.all(queues.splice(0).map((queue) => queue.close()));
  });

  it("delivers a job that was queued before a worker started", async () => {
    const queueName = `job-queue-integration-${randomUUID()}`;
    const queue = createJobQueue<{ value: number }>({ queueName, redisUrl });
    queues.push(queue);

    const jobId = await queue.enqueue("double", { value: 21 });

    const processed = Promise.withResolvers<{
      id: string;
      name: string;
      value: number;
    }>();
    const worker = createJobWorker<{ value: number }>({
      queueName,
      redisUrl,
      processor: async (job) => {
        processed.resolve({
          id: job.id,
          name: job.name,
          value: job.data.value,
        });
      },
      onError: (error) => processed.reject(error),
    });
    workers.push(worker);

    await expect(processed.promise).resolves.toEqual({
      id: jobId,
      name: "double",
      value: 21,
    });
  }, 10_000);

  it("retries a job after a transient processor failure", async () => {
    const queueName = `job-queue-integration-${randomUUID()}`;
    const queue = createJobQueue<{ value: number }>({ queueName, redisUrl });
    queues.push(queue);

    const processed = Promise.withResolvers<number>();
    const worker = createJobWorker<{ value: number }>({
      queueName,
      redisUrl,
      processor: async (job) => {
        if (job.attemptsMade === 0) {
          throw new Error("temporary failure");
        }

        processed.resolve(job.attemptsMade);
      },
      onError: (error) => processed.reject(error),
    });
    workers.push(worker);

    await worker.waitUntilReady();
    await queue.enqueue("retry-once", { value: 21 });

    const retryAttempt = await Promise.race([
      processed.promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("job was not retried")), 2_000),
      ),
    ]);

    expect(retryAttempt).toBe(1);
  }, 10_000);
});
