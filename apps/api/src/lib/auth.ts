import {
  createCaptureEmailProvider,
  createCaptureJobQueue,
  createQueuedVerificationEmailSender,
  type VerificationEmail,
} from "@competition-manager/email";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, organization } from "better-auth/plugins";

import { database } from "../infrastructure/database";
import { createDatabaseVerificationTokenStore, type VerificationTokenStore } from "./verification";

const localOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
];

const backendUrl =
  process.env.BETTER_AUTH_URL ?? process.env.BACKEND_URL ?? "http://localhost:3000";

type AuthEnvironment = Partial<
  Pick<
    NodeJS.ProcessEnv,
    "APP_ENV" | "BETTER_AUTH_URL" | "BACKEND_URL" | "FRONTEND_URL" | "MANAGER_URL" | "ADMIN_URL"
  >
>;

export function getTrustedOrigins(
  environment: AuthEnvironment = process.env as AuthEnvironment,
): string[] {
  const local =
    environment.APP_ENV === undefined ||
    environment.APP_ENV === "development" ||
    environment.APP_ENV === "test"
      ? localOrigins
      : [];

  return [
    environment.BETTER_AUTH_URL ?? environment.BACKEND_URL ?? backendUrl,
    environment.FRONTEND_URL,
    environment.MANAGER_URL,
    environment.ADMIN_URL,
    ...local,
  ].filter((origin): origin is string => Boolean(origin));
}

export function requireAuthSecret(
  appEnvironment = process.env.APP_ENV,
  secret = process.env.BETTER_AUTH_SECRET,
): string | undefined {
  if ((appEnvironment === "production" || appEnvironment === "staging") && !secret) {
    throw new Error("BETTER_AUTH_SECRET is required in production and staging");
  }
  return secret;
}

const authSecret = requireAuthSecret();
const trustedOrigins = getTrustedOrigins();

export function isVerifiedUser(user: { emailVerified: boolean }): boolean {
  return user.emailVerified;
}

export type VerificationEmailSender = (input: {
  user: { email: string };
  url: string;
  token: string;
}) => Promise<void>;

export type VerificationLink = {
  url: string;
  token: string;
};

export function createVerificationLink(input: { url: string; token: string }): VerificationLink {
  const deliveryToken = crypto.randomUUID();
  const url = new URL(input.url);
  url.searchParams.set("verification", deliveryToken);
  url.searchParams.delete("callbackURL");
  return {
    url: url.toString(),
    token: `${deliveryToken}.${input.token}`,
  };
}

export type AuthConfiguration = {
  verificationEmailSender?: VerificationEmailSender;
  verificationTokenStore?: VerificationTokenStore;
  verificationExpiresIn?: number;
};

const captureProvider = createCaptureEmailProvider();
const captureJobQueue = createCaptureJobQueue(captureProvider);

export const capturedVerificationEmails: VerificationEmail[] = captureProvider.messages;

export function createAuth(configuration: AuthConfiguration = {}) {
  const verificationExpiresIn = configuration.verificationExpiresIn ?? 60 * 60;
  const tokenStore =
    configuration.verificationTokenStore ?? createDatabaseVerificationTokenStore(database);
  const sender =
    configuration.verificationEmailSender ??
    createQueuedVerificationEmailSender({ queue: captureJobQueue });

  return betterAuth({
    appName: "Competition Manager",
    basePath: "/api/auth",
    baseURL: backendUrl,
    database: prismaAdapter(database, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
      // Unverified users retain sign-in access so the client can show resend state.
      requireEmailVerification: false,
    },
    emailVerification: {
      sendOnSignIn: true,
      sendOnSignUp: true,
      expiresIn: verificationExpiresIn,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url, token }) => {
        const verificationLink = createVerificationLink({ url, token });
        await tokenStore.issue(
          user.email,
          verificationLink.token,
          new Date(Date.now() + verificationExpiresIn * 1000),
        );
        await sender({ user, url: verificationLink.url, token: verificationLink.token });
      },
    },
    ...(authSecret ? { secret: authSecret } : {}),
    trustedOrigins,
    advanced: {
      useSecureCookies: process.env.APP_ENV === "production" || process.env.APP_ENV === "staging",
    },
    plugins: [organization(), admin()],
  });
}

export const defaultVerificationTokenStore = createDatabaseVerificationTokenStore(database);
export const auth = createAuth({ verificationTokenStore: defaultVerificationTokenStore });

export function createAuthHandler(
  authInstance: ReturnType<typeof createAuth>,
  tokenStore: VerificationTokenStore = defaultVerificationTokenStore,
): (request: Request) => Promise<Response> {
  return async (request) => {
    const url = new URL(request.url);
    if (url.pathname === "/api/auth/verify-email") {
      const token = url.searchParams.get("token") ?? "";
      const deliveryToken = url.searchParams.get("verification") ?? "";
      const storedToken = `${deliveryToken}.${token}`;
      if (!deliveryToken || !token || !(await tokenStore.consume(storedToken))) {
        return new Response(JSON.stringify({ code: "INVALID_TOKEN", message: "Invalid token" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Better Auth adds callbackURL=/ to generated links and redirects when
      // it is present. The API contract returns its JSON verification result;
      // preserve the signed token while removing the transport-only fields.
      url.searchParams.delete("verification");
      url.searchParams.delete("callbackURL");
      return authInstance.handler(new Request(url, request));
    }
    return authInstance.handler(request);
  };
}
