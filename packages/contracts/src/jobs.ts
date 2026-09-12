import { z } from "zod";

export const jobNameSchema = z.enum(["fixture.record", "auth.email-verification"]);
export const jobStatusSchema = z.enum(["queued", "processing", "completed", "failed"]);

export const fixtureRecordPayloadSchema = z.object({
  message: z.string().min(1),
});

export const verificationEmailJobPayloadSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  text: z.string().min(1),
  locale: z.enum(["en", "fr", "nl"]),
  verificationUrl: z.string().url(),
});

export const jobEnvelopeSchema = z.object({
  id: z.string().min(1),
  name: jobNameSchema,
  schemaVersion: z.number().int().positive(),
  payload: z.unknown(),
  businessKey: z.string().min(1),
  idempotencyKey: z.string().min(1),
  attempt: z.number().int().min(0),
  maxAttempts: z.number().int().min(1).max(10),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  correlationId: z.string().min(1),
  requestId: z.string().min(1),
});

export const failedJobSchema = z.object({
  id: z.string().min(1),
  name: jobNameSchema,
  businessKey: z.string().min(1),
  attempt: z.number().int().positive(),
  maxAttempts: z.number().int().positive(),
  failedAt: z.string().datetime(),
  errorCode: z.string().min(1),
  correlationId: z.string().min(1),
  requestId: z.string().min(1),
});

export const queueHealthSchema = z.object({
  available: z.boolean(),
  depth: z.number().int().min(0),
  failedJobs: z.number().int().min(0),
});

export type JobName = z.infer<typeof jobNameSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type JobEnvelope = z.infer<typeof jobEnvelopeSchema>;
export type FailedJob = z.infer<typeof failedJobSchema>;
export type QueueHealth = z.infer<typeof queueHealthSchema>;
