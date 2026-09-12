import { describe, expect, it, vi } from "vitest";

import { fixtureRecordHandler } from "./handlers";

describe("worker fixture handler", () => {
  it("validates its payload and emits only safe job metadata", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await fixtureRecordHandler({
      id: "job-1",
      name: "fixture.record",
      schemaVersion: 1,
      payload: { message: "hello" },
      businessKey: "fixture:handler",
      idempotencyKey: "fixture.record:fixture:handler",
      attempt: 1,
      maxAttempts: 3,
      createdAt: "2026-09-12T00:00:00.000Z",
      updatedAt: "2026-09-12T00:00:00.000Z",
      correlationId: "correlation-1",
      requestId: "request-1",
    });

    expect(log).toHaveBeenCalledWith(
      JSON.stringify({
        event: "fixture_job_completed",
        job_id: "job-1",
        correlation_id: "correlation-1",
        message_length: 5,
      }),
    );
    expect(log.mock.calls[0]?.[0]).not.toContain("hello");
    log.mockRestore();
  });
});
