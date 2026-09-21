import {
  applicationJobNames,
  type ApplicationJobData,
  type ApplicationJobName,
  type JobMessage,
  type JobWorker,
  type TerminalJobFailure,
} from "@repo/jobs";
import { describe, expect, it, vi } from "vitest";

import { createWorkerConsumer } from "./job-consumer";

describe("worker job consumer", () => {
  it("reports terminal job failures from the shared queue contract", async () => {
    let reportFailure:
      | ((failure: TerminalJobFailure<ApplicationJobData, ApplicationJobName>) => void)
      | undefined;
    const logger = { info: vi.fn(), error: vi.fn() };

    createWorkerConsumer({
      redisUrl: "redis://localhost:6379",
      logger,
      createWorker: (configuration) => {
        reportFailure = configuration.onFailed;
        return { waitUntilReady: vi.fn(), close: vi.fn() } as JobWorker;
      },
    });

    reportFailure?.({
      job: {
        id: "job-42",
        name: applicationJobNames.apiStarted,
        data: { startedAt: "2026-09-14T12:00:00.000Z" },
        attemptsMade: 5,
      },
      error: new Error("delivery failed"),
    });

    expect(logger.error).toHaveBeenCalledWith(
      "Worker job failed permanently: api.started (job-42)",
      expect.objectContaining({ message: "delivery failed" }),
    );
  });

  it("processes the typed API-started job", async () => {
    let processJob:
      | ((job: JobMessage<ApplicationJobData, ApplicationJobName>) => Promise<void>)
      | undefined;
    const logger = { info: vi.fn(), error: vi.fn() };

    createWorkerConsumer({
      redisUrl: "redis://localhost:6379",
      logger,
      createWorker: (configuration) => {
        processJob = configuration.processor;
        return { waitUntilReady: vi.fn(), close: vi.fn() } as JobWorker;
      },
    });

    await processJob?.({
      id: "job-42",
      name: applicationJobNames.apiStarted,
      data: { startedAt: "2026-09-14T12:00:00.000Z" },
      attemptsMade: 0,
    });

    expect(logger.info).toHaveBeenCalledWith("Processed API-started job job-42");
  });

  it("delegates athlete import jobs to the database processor", async () => {
    let processJob:
      | ((job: JobMessage<ApplicationJobData, ApplicationJobName>) => Promise<void>)
      | undefined;
    const processAthleteImport = vi.fn().mockResolvedValue(undefined);

    createWorkerConsumer({
      redisUrl: "redis://localhost:6379",
      logger: { info: vi.fn(), error: vi.fn() },
      processAthleteImport,
      createWorker: (configuration) => {
        processJob = configuration.processor;
        return { waitUntilReady: vi.fn(), close: vi.fn() } as JobWorker;
      },
    });

    await processJob?.({
      id: "job-43",
      name: applicationJobNames.athleteImport,
      data: { importBatchId: "batch-42" },
      attemptsMade: 1,
    });

    expect(processAthleteImport).toHaveBeenCalledWith("batch-42", 1);
  });
});
