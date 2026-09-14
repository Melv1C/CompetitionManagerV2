import type { JobWorker } from "@repo/jobs";

interface SignalSource {
  once: (signal: "SIGINT" | "SIGTERM", listener: () => void) => unknown;
}

interface WorkerLogger {
  info: (message: string) => void;
  error: (message: string, error: Error) => void;
}

interface WorkerLifecycleConfiguration {
  worker: JobWorker;
  signals?: SignalSource;
  logger: WorkerLogger;
}

export async function startWorkerLifecycle({
  worker,
  signals = process,
  logger,
}: WorkerLifecycleConfiguration) {
  await worker.waitUntilReady();
  logger.info("Competition Manager worker started");

  let stopping = false;

  async function stop() {
    if (stopping) return;
    stopping = true;

    try {
      await worker.close();
      logger.info("Competition Manager worker stopped");
    } catch (error) {
      logger.error("Worker shutdown failed", error as Error);
    }
  }

  signals.once("SIGTERM", () => void stop());
  signals.once("SIGINT", () => void stop());

  return { stop };
}
