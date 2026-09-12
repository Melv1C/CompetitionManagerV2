import { describe, expect, it } from "vitest";

import {
  createCaptureEmailProvider,
  createCaptureJobQueue,
  createQueuedVerificationEmailSender,
  createVerificationEmail,
} from "./index";

describe("verification email adapter", () => {
  it("renders localized, actionable messages without exposing a token separately", () => {
    const email = createVerificationEmail({
      to: "athlete@example.test",
      verificationUrl: "https://api.example.test/verify-email?token=opaque",
      locale: "fr",
    });
    expect(email.subject).toContain("Vérifiez");
    expect(email.text).toContain("Vérifiez votre adresse e-mail");
    expect(email.verificationUrl).toContain("opaque");
  });

  it("passes verification messages through the durable job seam", async () => {
    const provider = createCaptureEmailProvider();
    const queue = createCaptureJobQueue(provider);
    const send = createQueuedVerificationEmailSender({ queue, locale: "nl" });

    await send({
      user: { email: "user@example.test" },
      url: "https://api.example.test/verify-email?token=one-time",
      token: "one-time",
    });

    expect(queue.jobs).toHaveLength(1);
    expect(queue.jobs[0]!.name).toBe("auth.email-verification");
    expect(queue.jobs[0]!.businessKey).not.toContain("one-time");
    expect(provider.messages[0]!.locale).toBe("nl");
    expect(provider.messages[0]!.to).toBe("user@example.test");
  });
});
