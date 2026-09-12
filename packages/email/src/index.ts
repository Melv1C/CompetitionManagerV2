export type TransactionalEmail = {
  to: string;
  subject: string;
  text: string;
};

export function createTransactionalEmail(input: TransactionalEmail): TransactionalEmail {
  if (!input.to.includes("@")) {
    throw new Error("Transactional email recipient must be a valid email address");
  }
  return { ...input };
}

export type EmailLocale = "en" | "fr" | "nl";

export type VerificationEmail = TransactionalEmail & {
  locale: EmailLocale;
  verificationUrl: string;
};

export type VerificationEmailJob = {
  name: "auth.email-verification";
  schemaVersion: 1;
  businessKey: string;
  payload: VerificationEmail;
};

export type EmailProvider = {
  send(message: VerificationEmail): Promise<void>;
};

export type DurableJobEnqueuer = {
  enqueue(job: VerificationEmailJob): Promise<void>;
};

const messages = {
  en: {
    subject: "Verify your Competition Manager email",
    intro: "Please verify your email address to unlock Competition Manager actions.",
    action: "Verify your email",
  },
  fr: {
    subject: "Vérifiez votre adresse e-mail Competition Manager",
    intro: "Vérifiez votre adresse e-mail pour débloquer les actions Competition Manager.",
    action: "Vérifier mon adresse e-mail",
  },
  nl: {
    subject: "Verifieer je Competition Manager-e-mailadres",
    intro: "Verifieer je e-mailadres om Competition Manager-acties te ontgrendelen.",
    action: "Mijn e-mailadres verifiëren",
  },
} satisfies Record<EmailLocale, Record<string, string>>;

export function createVerificationEmail(input: {
  to: string;
  verificationUrl: string;
  locale?: EmailLocale;
}): VerificationEmail {
  const locale = input.locale ?? "en";
  const copy = messages[locale];
  return {
    ...createTransactionalEmail({
      to: input.to,
      subject: copy.subject,
      text: `${copy.intro}\n\n${copy.action}: ${input.verificationUrl}`,
    }),
    locale,
    verificationUrl: input.verificationUrl,
  };
}

export function createQueuedVerificationEmailSender(options: {
  queue: DurableJobEnqueuer;
  locale?: EmailLocale;
}): (input: { user: { email: string }; url: string; token?: string }) => Promise<void> {
  return async ({ user, url, token = url }) => {
    const message = createVerificationEmail({
      to: user.email,
      verificationUrl: url,
      locale: options.locale,
    });
    const tokenDigest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const idempotencyKey = btoa(String.fromCharCode(...new Uint8Array(tokenDigest)))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");
    await options.queue.enqueue({
      name: "auth.email-verification",
      schemaVersion: 1,
      businessKey: `auth.email-verification:${user.email.toLowerCase()}:${idempotencyKey}`,
      payload: message,
    });
  };
}

export function createCaptureEmailProvider(): EmailProvider & { messages: VerificationEmail[] } {
  const captured: VerificationEmail[] = [];
  return {
    messages: captured,
    async send(message) {
      captured.push({ ...message });
    },
  };
}

export function createCaptureJobQueue(provider: EmailProvider): DurableJobEnqueuer & {
  jobs: VerificationEmailJob[];
} {
  const jobs: VerificationEmailJob[] = [];
  return {
    jobs,
    async enqueue(job) {
      jobs.push({ ...job, payload: { ...job.payload } });
      await provider.send(job.payload);
    },
  };
}
