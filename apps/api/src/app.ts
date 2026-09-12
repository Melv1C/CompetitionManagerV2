import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";

import { apiErrorMiddleware, handleApiError, notFoundResponse, type ApiEnv } from "./errors";
import { createHealthApp, type HealthDependencies } from "./health";
import { database } from "./infrastructure/database";
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
import {
  createOrganizationService,
  type OrganizationService,
} from "./modules/organizations/service";

export type ApiDependencies = Partial<HealthDependencies> & {
  authHandler?: (request: Request) => Promise<Response>;
  authInstance?: ReturnType<typeof createAuth>;
  verificationEmailSender?: VerificationEmailSender;
  verificationTokenStore?: VerificationTokenStore;
  sessionResolver?: SessionResolver;
  organizationService?: OrganizationService;
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

function adminGuardedResponse(context: Context<ApiEnv>, session: AuthSession) {
  const denied = guardedResponse(context, session);
  if (denied) return denied;
  const role = (session!.user as { role?: string | null }).role;
  if (role !== "admin") {
    return context.json(
      {
        error: {
          code: "FORBIDDEN" as const,
          message: "Platform administrator access is required",
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
  const organizationService =
    dependencies.organizationService ?? createOrganizationService(database);

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

  for (const [method, path] of [
    ["GET", "/api/v1/admin/users"],
    ["POST", "/api/v1/admin/organizations"],
  ] as const) {
    app.on(method, path, async (context) => {
      const session = await resolveSession(context.req.raw);
      const denied = adminGuardedResponse(context, session);
      if (denied) return denied;

      if (method === "GET") {
        return context.json(
          await organizationService.listEligibleUsers(context.req.query("query") ?? ""),
        );
      }

      const body = await context.req.json().catch(() => undefined);
      const result = await organizationService.createForAdmin(
        session!.user.id,
        body,
        context.req.header("Idempotency-Key")?.trim() || crypto.randomUUID(),
      );
      return context.json(result, 201);
    });
  }

  for (const [method, path] of [
    ["GET", "/api/v1/manager/organizations"],
    ["GET", "/api/v1/manager/organizations/:organizationId"],
  ] as const) {
    app.on(method, path, async (context) => {
      const session = await resolveSession(context.req.raw);
      const denied = guardedResponse(context, session);
      if (denied) return denied;
      if (path.endsWith(":organizationId")) {
        return context.json(
          await organizationService.getForUser(
            session!.user.id,
            context.req.param("organizationId"),
          ),
        );
      }
      return context.json(await organizationService.listForUser(session!.user.id));
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
