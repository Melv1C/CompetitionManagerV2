interface ApiJobProducer {
  close: () => Promise<void>;
}

interface HttpServer {
  close: () => unknown;
}

interface SignalSource {
  once: (signal: "SIGINT" | "SIGTERM", listener: () => void) => unknown;
}

interface ShutdownLogger {
  error: (message: string, error: Error) => void;
}

interface ApiShutdownConfiguration {
  jobProducer: ApiJobProducer;
  httpServer: HttpServer;
}

interface ShutdownRegistrationConfiguration {
  signals?: SignalSource;
  shutdown: () => Promise<void>;
  logger: ShutdownLogger;
}

export function createApiShutdown({ jobProducer, httpServer }: ApiShutdownConfiguration) {
  let stopping = false;

  return async function shutdown() {
    if (stopping) return;
    stopping = true;

    try {
      await jobProducer.close();
    } finally {
      httpServer.close();
    }
  };
}

export function registerApiShutdown({
  signals = process,
  shutdown,
  logger,
}: ShutdownRegistrationConfiguration) {
  function handleSignal() {
    void shutdown().catch((error) => logger.error("API shutdown failed", error as Error));
  }

  signals.once("SIGTERM", handleSignal);
  signals.once("SIGINT", handleSignal);
}
