import "varlock/auto-load";
import { ENV } from "varlock/env";

import { createWorkerConsumer } from "./job-consumer";
import { startWorkerLifecycle } from "./worker-lifecycle";

const logger = {
  info: (message: string) => console.info(message),
  error: (message: string, error: Error) => console.error(message, error),
};

const worker = createWorkerConsumer({ redisUrl: ENV.REDIS_URL, logger });

await startWorkerLifecycle({ worker, logger });
