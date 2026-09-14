import { EventEmitter } from "node:events";

import { describe, expect, it, vi } from "vitest";

import { createApiShutdown, registerApiShutdown } from "./api-shutdown";

describe("API shutdown", () => {
  it("closes HTTP and reports queue-close failure after a termination signal", async () => {
    const signals = new EventEmitter();
    const closeHttp = vi.fn();
    const error = vi.fn();
    const shutdown = createApiShutdown({
      jobProducer: {
        close: vi.fn().mockRejectedValue(new Error("Redis unavailable")),
      },
      httpServer: { close: closeHttp },
    });

    registerApiShutdown({
      signals,
      shutdown,
      logger: { error },
    });
    signals.emit("SIGTERM");

    await vi.waitFor(() => expect(closeHttp).toHaveBeenCalledOnce());
    expect(error).toHaveBeenCalledWith("API shutdown failed", expect.any(Error));
  });
});
