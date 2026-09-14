import { Queue, Worker, type Job, type JobsOptions } from "bullmq";

const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 1_000,
  },
  removeOnComplete: {
    age: 24 * 60 * 60,
    count: 1_000,
  },
  removeOnFail: {
    age: 7 * 24 * 60 * 60,
    count: 5_000,
  },
};

export interface JobMessage<Data, Name extends string = string> {
  readonly id: string;
  readonly name: Name;
  readonly data: Data;
  readonly attemptsMade: number;
}

export interface TerminalJobFailure<Data, Name extends string = string> {
  readonly job: JobMessage<Data, Name> | undefined;
  readonly error: Error;
}

export interface JobQueue<Data = unknown, Name extends string = string> {
  enqueue: (name: Name, data: Data, options?: JobsOptions) => Promise<string>;
  close: () => Promise<void>;
}

export interface JobWorker {
  waitUntilReady: () => Promise<void>;
  close: () => Promise<void>;
}

interface QueueConfiguration {
  queueName: string;
  redisUrl: string;
}

interface WorkerConfiguration<
  Data,
  Result,
  Name extends string = string,
> extends QueueConfiguration {
  processor: (job: JobMessage<Data, Name>) => Promise<Result>;
  onError: (error: Error) => void;
  onFailed: (failure: TerminalJobFailure<Data, Name>) => void;
}

export function createJobQueue<Data = unknown, Name extends string = string>({
  queueName,
  redisUrl,
}: QueueConfiguration): JobQueue<Data, Name> {
  const queue = new Queue<Job<Data, unknown, Name>>(queueName, {
    connection: { url: redisUrl },
    defaultJobOptions,
  });

  return {
    async enqueue(name, data, options) {
      const job = await queue.add(name, data, options);

      if (!job.id) {
        throw new Error(`BullMQ did not assign an ID to ${name}`);
      }

      return job.id;
    },
    async close() {
      await queue.close();
    },
  };
}

export function createJobWorker<Data = unknown, Result = void, Name extends string = string>({
  queueName,
  redisUrl,
  processor,
  onError,
  onFailed,
}: WorkerConfiguration<Data, Result, Name>): JobWorker {
  const worker = new Worker<Data, Result, Name>(
    queueName,
    async (job) => {
      if (!job.id) {
        throw new Error(`BullMQ delivered ${job.name} without an ID`);
      }

      return processor({
        id: job.id,
        name: job.name,
        data: job.data,
        attemptsMade: job.attemptsMade,
      });
    },
    {
      connection: {
        url: redisUrl,
        maxRetriesPerRequest: null,
      },
    },
  );

  worker.on("error", (error) => {
    onError(error);
  });

  worker.on("failed", (job, error) => {
    const attempts = job?.opts.attempts ?? 1;
    const retriesExhausted = job === undefined || job.attemptsMade >= attempts;
    const cannotRetry = error.name === "UnrecoverableError";

    if (!retriesExhausted && !cannotRetry) {
      return;
    }

    onFailed({
      job:
        job?.id === undefined
          ? undefined
          : {
              id: job.id,
              name: job.name,
              data: job.data,
              attemptsMade: job.attemptsMade,
            },
      error,
    });
  });

  return {
    async waitUntilReady() {
      await worker.waitUntilReady();
    },
    async close() {
      await worker.close();
    },
  };
}

export const applicationQueueName = "competition-manager";

export const applicationJobNames = {
  apiStarted: "api.started",
} as const;

export type ApplicationJobName = (typeof applicationJobNames)[keyof typeof applicationJobNames];

export interface ApplicationJobData {
  readonly startedAt: string;
}

export type ApplicationJobQueue = JobQueue<ApplicationJobData, ApplicationJobName>;

interface ApplicationWorkerConfiguration<Result> {
  redisUrl: string;
  processor: (job: JobMessage<ApplicationJobData, ApplicationJobName>) => Promise<Result>;
  onError: (error: Error) => void;
  onFailed: (failure: TerminalJobFailure<ApplicationJobData, ApplicationJobName>) => void;
}

export function createApplicationJobQueue({
  redisUrl,
}: Pick<QueueConfiguration, "redisUrl">): ApplicationJobQueue {
  return createJobQueue<ApplicationJobData, ApplicationJobName>({
    queueName: applicationQueueName,
    redisUrl,
  });
}

export function createApplicationJobWorker<Result = void>(
  configuration: ApplicationWorkerConfiguration<Result>,
): JobWorker {
  return createJobWorker<ApplicationJobData, Result, ApplicationJobName>({
    queueName: applicationQueueName,
    ...configuration,
  });
}
