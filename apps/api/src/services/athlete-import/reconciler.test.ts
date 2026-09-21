import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/job-producer", () => ({ getApiJobProducer: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("./service", () => ({ athleteImportService: {} }));

import { createAthleteImportReconciler } from "./reconciler";

describe("athlete import reconciler", () => {
  it("dispatches queued imports immediately and prevents overlapping runs", async () => {
    let finishReconciliation: (() => void) | undefined;
    const reconciliationPending = new Promise<void>((resolve) => {
      finishReconciliation = resolve;
    });
    const producer = { athleteImport: vi.fn().mockResolvedValue("job-1") };
    const service = {
      reconcileQueuedImports: vi.fn(async (enqueue) => {
        await enqueue("batch-1", "job-1");
        await reconciliationPending;
        return { queued: 1, errors: [] };
      }),
    };
    const reconciler = createAthleteImportReconciler({
      intervalMs: 5,
      service: service as never,
      producer,
      log: { error: vi.fn() } as never,
    });

    reconciler.start();
    await vi.waitFor(() => expect(producer.athleteImport).toHaveBeenCalledWith("batch-1", "job-1"));
    await new Promise((resolve) => setTimeout(resolve, 15));
    expect(service.reconcileQueuedImports).toHaveBeenCalledOnce();

    finishReconciliation?.();
    reconciler.stop();
  });

  it("reports batch-specific dispatch errors", async () => {
    const error = new Error("Redis unavailable");
    const log = { error: vi.fn() };
    const service = {
      reconcileQueuedImports: vi.fn().mockResolvedValue({
        queued: 1,
        errors: [{ batchId: "batch-1", error }],
      }),
    };
    const reconciler = createAthleteImportReconciler({
      intervalMs: 60_000,
      service: service as never,
      producer: { athleteImport: vi.fn() },
      log: log as never,
    });

    reconciler.start();
    await vi.waitFor(() =>
      expect(log.error).toHaveBeenCalledWith("Could not dispatch queued athlete import batch-1", {
        metadata: { error },
      }),
    );
    reconciler.stop();
  });
});
