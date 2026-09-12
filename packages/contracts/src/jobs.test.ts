import { describe, expect, it } from "vitest";

import { jobEnvelopeSchema, jobNameSchema } from "./jobs";

describe("job contracts", () => {
  it("validates a versioned, correlated job envelope", () => {
    const envelope = jobEnvelopeSchema.parse({
      id: "job-1",
      name: "fixture.record",
      schemaVersion: 1,
      payload: { message: "hello" },
      businessKey: "fixture:one",
      idempotencyKey: "fixture.record:fixture:one",
      attempt: 0,
      maxAttempts: 3,
      createdAt: "2026-09-12T00:00:00.000Z",
      updatedAt: "2026-09-12T00:00:00.000Z",
      correlationId: "request-1",
      requestId: "request-1",
    });

    expect(envelope.name).toBe("fixture.record");
    expect(jobNameSchema.safeParse("unknown.job").success).toBe(false);
  });
});
