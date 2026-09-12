import type { JobHandler } from "@competition-manager/backend-infrastructure";
import {
  fixtureRecordPayloadSchema,
  verificationEmailJobPayloadSchema,
  type JobEnvelope,
} from "@competition-manager/contracts";
import { createCaptureEmailProvider, type EmailProvider } from "@competition-manager/email";

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

export function createVerificationEmailHandler(
  provider: EmailProvider = createCaptureEmailProvider(),
): JobHandler {
  return async (job: JobEnvelope) => {
    const message = verificationEmailJobPayloadSchema.parse(job.payload);
    await provider.send(message);
    console.log(
      JSON.stringify({
        event: "verification_email_sent",
        job_id: job.id,
        correlation_id: job.correlationId,
        locale: message.locale,
      }),
    );
  };
}

export const verificationEmailHandler = createVerificationEmailHandler();

export const workerHandlers = {
  "fixture.record": fixtureRecordHandler,
  "auth.email-verification": verificationEmailHandler,
} as const;
