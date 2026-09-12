import { randomUUID } from "node:crypto";

import {
  failedJobSchema,
  jobEnvelopeSchema,
  jobStatusSchema,
  type FailedJob,
  type JobEnvelope,
  type JobName,
  type JobStatus,
  type QueueHealth,
} from "@competition-manager/contracts";
import { createClient } from "redis";

type RedisQueueClient = ReturnType<typeof createClient>;

const ENQUEUE_SCRIPT = `
local existing = redis.call('GET', KEYS[1])
if existing then return { 0, existing } end
redis.call('SET', KEYS[1], ARGV[1])
redis.call('HSET', KEYS[2], 'envelope', ARGV[2], 'status', 'queued')
redis.call('RPUSH', KEYS[3], ARGV[1])
return { 1, ARGV[1] }
`;

const RETRY_SCRIPT = `
if redis.call('HGET', KEYS[1], 'status') ~= 'failed' then return 0 end
redis.call('HSET', KEYS[1], 'envelope', ARGV[1], 'status', 'queued', 'failure', '')
redis.call('ZREM', KEYS[2], ARGV[2])
redis.call('RPUSH', KEYS[3], ARGV[2])
return 1
`;

const PROMOTE_DUE_SCRIPT = `
local ids = redis.call('ZRANGE', KEYS[1], 0, ARGV[1], 'BYSCORE')
for _, id in ipairs(ids) do
  if redis.call('ZREM', KEYS[1], id) == 1 then redis.call('RPUSH', KEYS[2], id) end
end
return #ids
`;

const RECOVER_PROCESSING_SCRIPT = `
local ids = redis.call('LRANGE', KEYS[1], 0, -1)
for index = #ids, 1, -1 do redis.call('RPUSH', KEYS[2], ids[index]) end
redis.call('DEL', KEYS[1])
return #ids
`;

export type EnqueueJobInput<TPayload> = {
  name: JobName;
  schemaVersion: number;
  payload: TPayload;
  businessKey: string;
  idempotencyKey?: string;
  correlationId?: string;
  requestId?: string;
  maxAttempts?: number;
};

export type EnqueueJobResult = {
  job: JobEnvelope;
  duplicate: boolean;
};

export type JobHandler = (job: JobEnvelope) => Promise<void>;

export type JobRecord = {
  job: JobEnvelope;
  status: JobStatus;
  failure?: FailedJob;
};

export type RedisJobQueueOptions = {
  prefix?: string;
  defaultMaxAttempts?: number;
  retryBaseDelayMs?: number;
  retryMaxDelayMs?: number;
  retryJitter?: number;
  blockingTimeoutSeconds?: number;
  now?: () => Date;
  random?: () => number;
};

export type RedisJobQueue = {
  enqueue<TPayload>(input: EnqueueJobInput<TPayload>): Promise<EnqueueJobResult>;
  get(jobId: string): Promise<JobRecord | null>;
  listFailed(): Promise<FailedJob[]>;
  retryFailed(jobId: string): Promise<boolean>;
  health(): Promise<QueueHealth>;
  processNext(handlers: Readonly<Record<JobName, JobHandler>>): Promise<boolean>;
  run(handlers: Readonly<Record<JobName, JobHandler>>): Promise<void>;
  stop(): void;
};

function retryDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  jitter: number,
  random: () => number,
): number {
  const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** Math.max(0, attempt - 1));
  const spread = exponential * jitter;
  return Math.min(
    maxDelayMs,
    Math.max(0, Math.round(exponential - spread + random() * spread * 2)),
  );
}

function errorCode(error: unknown): string {
  return error instanceof Error && error.name ? error.name : "JobError";
}

export function createRedisJobQueue(
  client: RedisQueueClient,
  options: RedisJobQueueOptions = {},
): RedisJobQueue {
  const prefix = options.prefix ?? "competition-manager:jobs";
  const keys = {
    queue: `${prefix}:queue`,
    processing: `${prefix}:processing`,
    delayed: `${prefix}:delayed`,
    failed: `${prefix}:failed`,
    idempotency: (key: string) => `${prefix}:idempotency:${key}`,
    job: (id: string) => `${prefix}:job:${id}`,
  };
  const now = options.now ?? (() => new Date());
  const random = options.random ?? Math.random;
  const defaultMaxAttempts = options.defaultMaxAttempts ?? 3;
  const retryBaseDelayMs = options.retryBaseDelayMs ?? 1_000;
  const retryMaxDelayMs = options.retryMaxDelayMs ?? 60_000;
  const retryJitter = options.retryJitter ?? 0.2;
  const blockingTimeoutSeconds = options.blockingTimeoutSeconds ?? 1;
  let accepting = true;
  let running = false;

  async function readRecord(jobId: string): Promise<JobRecord | null> {
    const stored = await client.hGetAll(keys.job(jobId));
    if (!stored.envelope || !stored.status) return null;
    const job = jobEnvelopeSchema.parse(JSON.parse(stored.envelope));
    const status = jobStatusSchema.parse(stored.status);
    return {
      job,
      status,
      failure: stored.failure ? failedJobSchema.parse(JSON.parse(stored.failure)) : undefined,
    };
  }

  async function promoteDueJobs(): Promise<void> {
    await client.eval(PROMOTE_DUE_SCRIPT, {
      keys: [keys.delayed, keys.queue],
      arguments: [String(now().getTime())],
    });
  }

  async function acknowledge(jobId: string): Promise<void> {
    await client.lRem(keys.processing, 1, jobId);
  }

  async function recoverProcessing(): Promise<void> {
    await client.eval(RECOVER_PROCESSING_SCRIPT, {
      keys: [keys.processing, keys.queue],
    });
  }

  async function processJob(
    jobId: string,
    handlers: Readonly<Record<JobName, JobHandler>>,
  ): Promise<void> {
    const record = await readRecord(jobId);
    if (!record || record.status === "completed" || record.status === "failed") {
      await acknowledge(jobId);
      return;
    }

    const startedAt = now();
    const job = jobEnvelopeSchema.parse({
      ...record.job,
      attempt: record.job.attempt + 1,
      updatedAt: startedAt.toISOString(),
    });
    await client.hSet(keys.job(jobId), { envelope: JSON.stringify(job), status: "processing" });

    try {
      const handler = handlers[job.name];
      if (!handler) throw new Error(`No handler registered for ${job.name}`);
      await handler(job);
      await client.hSet(keys.job(jobId), { status: "completed", completedAt: now().toISOString() });
      await acknowledge(jobId);
    } catch (error) {
      const failedAt = now();
      const failure = failedJobSchema.parse({
        id: job.id,
        name: job.name,
        businessKey: job.businessKey,
        attempt: job.attempt,
        maxAttempts: job.maxAttempts,
        failedAt: failedAt.toISOString(),
        errorCode: errorCode(error),
        correlationId: job.correlationId,
        requestId: job.requestId,
      });
      if (job.attempt >= job.maxAttempts) {
        await client.hSet(keys.job(jobId), { status: "failed", failure: JSON.stringify(failure) });
        await client.zAdd(keys.failed, { score: failedAt.getTime(), value: jobId });
      } else {
        await client.hSet(keys.job(jobId), { envelope: JSON.stringify(job), status: "queued" });
        const delay = retryDelay(
          job.attempt,
          retryBaseDelayMs,
          retryMaxDelayMs,
          retryJitter,
          random,
        );
        await client.zAdd(keys.delayed, { score: failedAt.getTime() + delay, value: jobId });
      }
      await acknowledge(jobId);
    }
  }

  return {
    async enqueue<TPayload>(input: EnqueueJobInput<TPayload>): Promise<EnqueueJobResult> {
      if (!accepting) throw new Error("Job queue is stopping");
      const createdAt = now().toISOString();
      const idempotencyKey = input.idempotencyKey ?? `${input.name}:${input.businessKey}`;
      const job = jobEnvelopeSchema.parse({
        id: randomUUID(),
        name: input.name,
        schemaVersion: input.schemaVersion,
        payload: input.payload,
        businessKey: input.businessKey,
        idempotencyKey,
        attempt: 0,
        maxAttempts: input.maxAttempts ?? defaultMaxAttempts,
        createdAt,
        updatedAt: createdAt,
        correlationId: input.correlationId ?? idempotencyKey,
        requestId: input.requestId ?? idempotencyKey,
      });
      const result = (await client.eval(ENQUEUE_SCRIPT, {
        keys: [keys.idempotency(idempotencyKey), keys.job(job.id), keys.queue],
        arguments: [job.id, JSON.stringify(job)],
      })) as Array<string | number>;
      const duplicate = Number(result[0]) === 0;
      const persisted = await readRecord(String(result[1]));
      if (!persisted) throw new Error("Redis queue did not persist the job");
      return { job: persisted.job, duplicate };
    },

    get: readRecord,

    async listFailed(): Promise<FailedJob[]> {
      const ids = await client.zRange(keys.failed, 0, -1, { REV: true });
      const failures = await Promise.all(
        ids.map(async (id) => (await readRecord(id))?.failure ?? null),
      );
      return failures.filter((failure: FailedJob | null): failure is FailedJob => failure !== null);
    },

    async retryFailed(jobId: string): Promise<boolean> {
      const record = await readRecord(jobId);
      if (!record || record.status !== "failed") return false;
      const retried = jobEnvelopeSchema.parse({
        ...record.job,
        attempt: 0,
        updatedAt: now().toISOString(),
      });
      const result = await client.eval(RETRY_SCRIPT, {
        keys: [keys.job(jobId), keys.failed, keys.queue],
        arguments: [JSON.stringify(retried), jobId],
      });
      return Number(result) === 1;
    },

    async health(): Promise<QueueHealth> {
      if (!client.isReady) return { available: false, depth: 0, failedJobs: 0 };
      return {
        available: client.isReady,
        depth:
          (await client.lLen(keys.queue)) +
          (await client.lLen(keys.processing)) +
          (await client.zCard(keys.delayed)),
        failedJobs: await client.zCard(keys.failed),
      };
    },

    async processNext(handlers): Promise<boolean> {
      await promoteDueJobs();
      const jobId = await client.brPopLPush(keys.queue, keys.processing, blockingTimeoutSeconds);
      if (!jobId) return false;
      await processJob(jobId, handlers);
      return true;
    },

    async run(handlers): Promise<void> {
      if (running) throw new Error("Job queue is already running");
      running = true;
      accepting = true;
      await recoverProcessing();
      try {
        while (running) await this.processNext(handlers);
      } finally {
        running = false;
      }
    },

    stop(): void {
      accepting = false;
      running = false;
    },
  };
}

export function isRetryableJobError(error: unknown): boolean {
  return error instanceof Error && error.name !== "PermanentJobError";
}
