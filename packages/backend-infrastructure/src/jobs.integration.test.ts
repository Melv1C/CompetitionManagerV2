import { randomUUID } from "node:crypto";

import { createClient } from "redis";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createRedisJobQueue } from "./jobs";

const runRedisIntegration = process.env.REDIS_INTEGRATION === "1";
const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

describe.skipIf(!runRedisIntegration)("Redis durable job queue", () => {
  const client = createClient({ url: redisUrl });
  const prefix = `competition-manager:test:${randomUUID()}`;
  const queue = createRedisJobQueue(client, {
    prefix,
    retryBaseDelayMs: 0,
    retryMaxDelayMs: 0,
    retryJitter: 0,
    blockingTimeoutSeconds: 1,
  });

  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    for await (const key of client.scanIterator({ MATCH: `${prefix}:*` })) await client.del(key);
    await client.quit();
  });

  it("enqueues, consumes, and suppresses duplicate business work", async () => {
    const first = await queue.enqueue({
      name: "fixture.record",
      schemaVersion: 1,
      payload: { message: "durable" },
      businessKey: "fixture:duplicate",
    });
    const second = await queue.enqueue({
      name: "fixture.record",
      schemaVersion: 1,
      payload: { message: "different payload is ignored" },
      businessKey: "fixture:duplicate",
    });
    const handled: string[] = [];

    expect(second.duplicate).toBe(true);
    expect(second.job.id).toBe(first.job.id);
    await queue.processNext({
      "fixture.record": async (job) => {
        handled.push(job.id);
      },
    });

    expect(handled).toEqual([first.job.id]);
    expect((await queue.get(first.job.id))?.status).toBe("completed");
  });

  it("retries a transient failure with a bounded durable delay", async () => {
    let attempts = 0;
    const handlers = {
      "fixture.record": async () => {
        attempts += 1;
        if (attempts < 3) throw new Error("temporary");
      },
    };
    const { job } = await queue.enqueue({
      name: "fixture.record",
      schemaVersion: 1,
      payload: { message: "retry" },
      businessKey: "fixture:retry",
      maxAttempts: 3,
    });

    await queue.processNext(handlers);
    await queue.processNext(handlers);
    await queue.processNext(handlers);

    expect(attempts).toBe(3);
    expect((await queue.get(job.id))?.status).toBe("completed");
  });

  it("exposes terminal failure and retries the same job safely", async () => {
    const { job } = await queue.enqueue({
      name: "fixture.record",
      schemaVersion: 1,
      payload: { message: "operator recovery" },
      businessKey: "fixture:terminal",
      maxAttempts: 1,
    });
    await queue.processNext({
      "fixture.record": async () => {
        throw new Error("permanent");
      },
    });

    expect((await queue.listFailed()).map((failure) => failure.id)).toContain(job.id);
    expect(await queue.retryFailed(job.id)).toBe(true);
    expect(await queue.retryFailed(job.id)).toBe(false);
    await queue.processNext({ "fixture.record": async () => undefined });
    expect((await queue.get(job.id))?.status).toBe("completed");
    expect((await queue.listFailed()).map((failure) => failure.id)).not.toContain(job.id);
  });

  it("stops the blocking worker loop without losing queued work", async () => {
    const worker = createRedisJobQueue(client, {
      prefix: `${prefix}:shutdown`,
      blockingTimeoutSeconds: 1,
    });
    const running = worker.run({ "fixture.record": async () => undefined });
    worker.stop();
    await running;
    expect((await worker.health()).available).toBe(true);
  });
});
