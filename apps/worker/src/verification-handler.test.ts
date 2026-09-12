import { createCaptureEmailProvider } from "@competition-manager/email";
import { describe, expect, it, vi } from "vitest";

import { createVerificationEmailHandler } from "./handlers";

describe("verification email worker handler", () => {
  it("delivers the localized message while logging only safe job metadata", async () => {
    const provider = createCaptureEmailProvider();
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await createVerificationEmailHandler(provider)({
      id: "job-1",
      name: "auth.email-verification",
      schemaVersion: 1,
      payload: {
        to: "user@example.test",
        subject: "Verify",
        text: "Verify: https://example.test/verify?token=secret",
        locale: "en",
        verificationUrl: "https://example.test/verify?token=secret",
      },
      businessKey: "auth.email-verification:user:key",
      idempotencyKey: "auth.email-verification:user:key",
      attempt: 1,
      maxAttempts: 3,
      createdAt: "2026-09-12T00:00:00.000Z",
      updatedAt: "2026-09-12T00:00:00.000Z",
      correlationId: "correlation-1",
      requestId: "request-1",
    });

    expect(provider.messages).toHaveLength(1);
    expect(provider.messages[0]!.to).toBe("user@example.test");
    expect(log).toHaveBeenCalledWith(
      JSON.stringify({
        event: "verification_email_sent",
        job_id: "job-1",
        correlation_id: "correlation-1",
        locale: "en",
      }),
    );
    expect(log.mock.calls[0]?.[0]).not.toContain("secret");
    log.mockRestore();
  });
});
