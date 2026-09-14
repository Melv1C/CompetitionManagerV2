import { EventEmitter } from "node:events";

import type { JobWorker } from "@repo/jobs";
import { describe, expect, it, vi } from "vitest";

import { startWorkerLifecycle } from "./worker-lifecycle";

describe("worker lifecycle", () => {
  it("waits for Redis, then closes the consumer once when termination starts", async () => {
    const signals = new EventEmitter();
    const worker = {
      waitUntilReady: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    } as JobWorker;
    const info = vi.fn();
    const error = vi.fn();

    await startWorkerLifecycle({ worker, signals, logger: { info, error } });
    signals.emit("SIGTERM");
    signals.emit("SIGINT");
    await vi.waitFor(() => expect(worker.close).toHaveBeenCalledOnce());

    expect(worker.waitUntilReady).toHaveBeenCalledOnce();
    expect(info).toHaveBeenCalledWith("Competition Manager worker started");
    expect(info).toHaveBeenCalledWith("Competition Manager worker stopped");
    expect(error).not.toHaveBeenCalled();
  });

  it("reports a shutdown failure", async () => {
    const signals = new EventEmitter();
    const worker = {
      waitUntilReady: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockRejectedValue(new Error("Redis unavailable")),
    } as JobWorker;
    const error = vi.fn();

    await startWorkerLifecycle({
      worker,
      signals,
      logger: { info: vi.fn(), error },
    });
    signals.emit("SIGTERM");
    await vi.waitFor(() => expect(error).toHaveBeenCalledOnce());

    expect(error).toHaveBeenCalledWith("Worker shutdown failed", expect.any(Error));
  });
});
