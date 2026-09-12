import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";

import { apiErrorMiddleware, handleApiError, notFoundResponse, type ApiEnv } from "./errors";
import { createHealthApp, type HealthDependencies } from "./health";
import {
  auth,
  createAuth,
  createAuthHandler,
  defaultVerificationTokenStore,
  getTrustedOrigins,
  isVerifiedUser,
  type VerificationEmailSender,
} from "./lib/auth";
import type { VerificationTokenStore } from "./lib/verification";

export type ApiDependencies = Partial<HealthDependencies> & {
  authHandler?: (request: Request) => Promise<Response>;
  authInstance?: ReturnType<typeof createAuth>;
  verificationEmailSender?: VerificationEmailSender;
  verificationTokenStore?: VerificationTokenStore;
  sessionResolver?: SessionResolver;
};

type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;
export type SessionResolver = (request: Request) => Promise<AuthSession>;

function configuredOrigins(): string[] {
  return getTrustedOrigins();
}

const authRoutes = [
  ["GET", "/api/auth/get-session"],
  ["POST", "/api/auth/sign-up/email"],
  ["POST", "/api/auth/sign-in/email"],
  ["POST", "/api/auth/sign-out"],
  ["POST", "/api/auth/send-verification-email"],
  ["GET", "/api/auth/verify-email"],
] as const;

function guardedResponse(context: Context<ApiEnv>, session: AuthSession) {
  if (!session) {
    return context.json(
      {
        error: {
          code: "UNAUTHORIZED" as const,
          message: "Authentication is required",
          requestId: context.get("requestId"),
          details: {},
        },
      },
      401,
    );
  }
  if (!isVerifiedUser(session.user)) {
    return context.json(
      {
        error: {
          code: "EMAIL_NOT_VERIFIED" as const,
          message: "Email verification is required for this action",
          requestId: context.get("requestId"),
          details: {},
        },
      },
      403,
    );
  }
  return null;
}

const protectedActions = [
  ["GET", "/api/v1/manager"],
  ["POST", "/api/v1/registrations"],
  ["POST", "/api/v1/payments"],
  ["POST", "/api/v1/organizations/invitations/accept"],
] as const;

export function createApiApp(dependencies: ApiDependencies = {}): Hono<ApiEnv> {
  const app = new Hono<ApiEnv>();
  const origins = configuredOrigins();
  const authInstance =
    dependencies.authInstance ??
    (dependencies.verificationEmailSender
      ? createAuth({
          verificationEmailSender: dependencies.verificationEmailSender,
          verificationTokenStore: dependencies.verificationTokenStore,
        })
      : auth);
  const verificationTokenStore =
    dependencies.verificationTokenStore ?? defaultVerificationTokenStore;
  const authHandler =
    dependencies.authHandler ?? createAuthHandler(authInstance, verificationTokenStore);

  app.use("*", apiErrorMiddleware());
  app.onError(handleApiError);
  app.notFound(notFoundResponse);

  app.use(
    "/api/auth/*",
    cors({
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "OPTIONS"],
      credentials: true,
      maxAge: 600,
      origin: (origin) => (origins.includes(origin) ? origin : undefined),
    }),
  );

  const resolveSession =
    dependencies.sessionResolver ??
    ((request) => authInstance.api.getSession({ headers: request.headers }));

  for (const [method, path] of authRoutes) {
    app.on(method, path, (context) => authHandler(context.req.raw));
  }

  for (const [method, path] of protectedActions) {
    app.on(method, path, async (context) => {
      const denied = guardedResponse(context, await resolveSession(context.req.raw));
      if (denied) return denied;
      return context.json({ status: "ready" as const });
    });
  }

  app.route(
    "/",
    createHealthApp({
      database: dependencies.database ?? (() => Promise.resolve(false)),
      redis: dependencies.redis ?? (() => Promise.resolve(false)),
    }),
  );

  return app;
}
