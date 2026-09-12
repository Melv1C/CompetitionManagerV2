import { describe, expect, it } from "vitest";

import { apiErrorEnvelopeSchema } from "./errors";

describe("versioned API error contract", () => {
  it("accepts the stable display-safe error envelope", () => {
    expect(
      apiErrorEnvelopeSchema.parse({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          fieldErrors: { "entries.0.eventId": ["EVENT_REQUIRED"] },
          requestId: "request-123",
          details: { issues: [] },
        },
      }),
    ).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        fieldErrors: { "entries.0.eventId": ["EVENT_REQUIRED"] },
        requestId: "request-123",
        details: { issues: [] },
      },
    });
  });
});
