import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, organization } from "better-auth/plugins";

import { database } from "../infrastructure/database";

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

export function getTrustedOrigins(environment: AuthEnvironment = process.env): string[] {
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

export const auth = betterAuth({
  appName: "Competition Manager",
  basePath: "/api/auth",
  baseURL: backendUrl,
  database: prismaAdapter(database, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // Email delivery and verification gating belong to the next auth slice.
    requireEmailVerification: false,
  },
  emailVerification: {
    sendOnSignIn: false,
    sendOnSignUp: false,
  },
  ...(authSecret ? { secret: authSecret } : {}),
  trustedOrigins,
  advanced: {
    useSecureCookies: process.env.APP_ENV === "production" || process.env.APP_ENV === "staging",
  },
  plugins: [organization(), admin()],
});

export function isVerifiedUser(user: { emailVerified: boolean }): boolean {
  return user.emailVerified;
}
