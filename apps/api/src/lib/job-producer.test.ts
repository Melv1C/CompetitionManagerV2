import { applicationJobNames, type ApplicationJobQueue } from "@repo/jobs";
import { describe, expect, it, vi } from "vitest";

import { createApiJobProducer } from "./job-producer";

describe("API job producer", () => {
  it("enqueues the typed API-started job after the server is ready", async () => {
    const enqueue = vi.fn().mockResolvedValue("job-42");
    const producer = createApiJobProducer({
      queue: {
        enqueue,
        close: vi.fn(),
      } as ApplicationJobQueue,
      now: () => new Date("2026-09-14T12:00:00.000Z"),
    });

    await producer.serverReady();

    expect(enqueue).toHaveBeenCalledWith(applicationJobNames.apiStarted, {
      startedAt: "2026-09-14T12:00:00.000Z",
    });
  });

  it("closes the Redis queue during API shutdown", async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const producer = createApiJobProducer({
      queue: {
        enqueue: vi.fn(),
        close,
      } as ApplicationJobQueue,
    });

    await producer.close();

    expect(close).toHaveBeenCalledOnce();
  });
});
