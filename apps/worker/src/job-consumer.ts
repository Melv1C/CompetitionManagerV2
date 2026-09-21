import {
  applicationJobNames,
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
  processAthleteImport?: (importBatchId: string, attemptsMade: number) => Promise<void>;
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
  processAthleteImport = async () => {
    throw new Error("Athlete import processor is not configured");
  },
  createWorker = createApplicationJobWorker,
}: ApplicationWorkerConfiguration): JobWorker {
  return createWorker({
    redisUrl,
    async processor(job) {
      if (job.name === applicationJobNames.apiStarted) {
        logger.info(`Processed API-started job ${job.id}`);
        return;
      }
      if (job.name === applicationJobNames.athleteImport && "importBatchId" in job.data) {
        await processAthleteImport(job.data.importBatchId, job.attemptsMade);
        logger.info(`Applied athlete import ${job.data.importBatchId}`);
        return;
      }
      throw new Error(`Unsupported job ${job.name}`);
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
