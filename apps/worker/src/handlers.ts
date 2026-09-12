import type { JobHandler } from "@competition-manager/backend-infrastructure";
import { fixtureRecordPayloadSchema, type JobEnvelope } from "@competition-manager/contracts";

export const fixtureRecordHandler: JobHandler = async (job: JobEnvelope) => {
  const payload = fixtureRecordPayloadSchema.parse(job.payload);
  console.log(
    JSON.stringify({
      event: "fixture_job_completed",
      job_id: job.id,
      correlation_id: job.correlationId,
      message_length: payload.message.length,
    }),
  );
};

export const workerHandlers = {
  "fixture.record": fixtureRecordHandler,
} as const;
