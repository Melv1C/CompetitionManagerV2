import { Queue, Worker, type Job, type JobsOptions } from "bullmq";

const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 1_000,
  },
};

export interface JobMessage<Data> {
  readonly id: string;
  readonly name: string;
  readonly data: Data;
  readonly attemptsMade: number;
}

export interface JobQueue<Data = unknown> {
  enqueue: (name: string, data: Data, options?: JobsOptions) => Promise<string>;
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

interface WorkerConfiguration<Data, Result> extends QueueConfiguration {
  processor: (job: JobMessage<Data>) => Promise<Result>;
  onError: (error: Error) => void;
}

export function createJobQueue<Data = unknown>({
  queueName,
  redisUrl,
}: QueueConfiguration): JobQueue<Data> {
  const queue = new Queue<Job<Data, unknown, string>>(queueName, {
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

export function createJobWorker<Data = unknown, Result = void>({
  queueName,
  redisUrl,
  processor,
  onError,
}: WorkerConfiguration<Data, Result>): JobWorker {
  const worker = new Worker<Data, Result, string>(
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

  return {
    async waitUntilReady() {
      await worker.waitUntilReady();
    },
    async close() {
      await worker.close();
    },
  };
}
