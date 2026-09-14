import {
  createApplicationJobWorker,
  type ApplicationJobData,
  type ApplicationJobName,
  type JobMessage,
  type JobWorker,
  type TerminalJobFailure,
} from "@repo/jobs";

interface WorkerLogger {
  info: (message: string) => void;
  error: (message: string, error: Error) => void;
}

interface ApplicationWorkerConfiguration {
  redisUrl: string;
  logger: WorkerLogger;
  createWorker?: (configuration: {
    redisUrl: string;
    processor: (job: JobMessage<ApplicationJobData, ApplicationJobName>) => Promise<void>;
    onError: (error: Error) => void;
    onFailed: (failure: TerminalJobFailure<ApplicationJobData, ApplicationJobName>) => void;
  }) => JobWorker;
}

export function createWorkerConsumer({
  redisUrl,
  logger,
  createWorker = createApplicationJobWorker,
}: ApplicationWorkerConfiguration): JobWorker {
  return createWorker({
    redisUrl,
    async processor(job) {
      logger.info(`Processed API-started job ${job.id}`);
    },
    onError(error) {
      logger.error("Worker Redis error", error);
    },
    onFailed(failure) {
      const job = failure.job;
      const identifier = job ? `${job.name} (${job.id})` : "unknown job";
      logger.error(`Worker job failed permanently: ${identifier}`, failure.error);
    },
  });
}
