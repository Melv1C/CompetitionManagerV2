import { randomUUID } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import {
  createJobQueue,
  createJobWorker,
  type JobQueue,
  type JobWorker,
  type TerminalJobFailure,
} from "./job-queue";

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
      onFailed: (failure) => processed.reject(failure.error),
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
      onFailed: (failure) => processed.reject(failure.error),
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

  it("reports a terminal failure after retries are exhausted", async () => {
    const queueName = `job-queue-integration-${randomUUID()}`;
    const queue = createJobQueue<{ value: number }>({ queueName, redisUrl });
    queues.push(queue);

    let processingAttempts = 0;
    const terminalFailure = Promise.withResolvers<TerminalJobFailure<{ value: number }>>();
    const worker = createJobWorker<{ value: number }>({
      queueName,
      redisUrl,
      processor: async () => {
        processingAttempts += 1;
        throw new Error("permanent failure");
      },
      onError: (error) => terminalFailure.reject(error),
      onFailed: (failure) => terminalFailure.resolve(failure),
    });
    workers.push(worker);

    await worker.waitUntilReady();
    const jobId = await queue.enqueue(
      "always-fails",
      { value: 21 },
      {
        attempts: 2,
        backoff: { type: "fixed", delay: 10 },
      },
    );

    const failure = await Promise.race([
      terminalFailure.promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("terminal failure was not reported")), 2_000),
      ),
    ]);

    expect({
      id: failure.job?.id,
      name: failure.job?.name,
      data: failure.job?.data,
      attemptsMade: failure.job?.attemptsMade,
      error: failure.error.message,
      processingAttempts,
    }).toEqual({
      id: jobId,
      name: "always-fails",
      data: { value: 21 },
      attemptsMade: 2,
      error: "permanent failure",
      processingAttempts: 2,
    });
  }, 10_000);
});
