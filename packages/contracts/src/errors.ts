import { z } from "zod";

export const apiErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "INTERNAL_SERVER_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "EMAIL_NOT_VERIFIED",
  "IDEMPOTENCY_KEY_REUSED",
  "CLUB_NOT_FOUND",
]);

export const validationIssueSchema = z.object({
  code: z.string(),
  path: z.array(z.union([z.string(), z.number()])),
  message: z.string(),
});

export const apiErrorSchema = z.object({
  code: apiErrorCodeSchema,
  message: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  requestId: z.string(),
  details: z
    .object({ issues: z.array(validationIssueSchema) })
    .or(z.record(z.string(), z.unknown())),
});

export const apiErrorEnvelopeSchema = z.object({
  error: apiErrorSchema,
});

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>;
