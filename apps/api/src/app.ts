import { Hono } from "hono";
import { cors } from "hono/cors";

import { apiErrorMiddleware, handleApiError, notFoundResponse, type ApiEnv } from "./errors";
import { createHealthApp, type HealthDependencies } from "./health";
import { auth, getTrustedOrigins } from "./lib/auth";

export type ApiDependencies = Partial<HealthDependencies> & {
  authHandler?: (request: Request) => Promise<Response>;
};

function configuredOrigins(): string[] {
  return getTrustedOrigins();
}

const authRoutes = [
  ["GET", "/api/auth/get-session"],
  ["POST", "/api/auth/sign-up/email"],
  ["POST", "/api/auth/sign-in/email"],
  ["POST", "/api/auth/sign-out"],
] as const;

export function createApiApp(dependencies: ApiDependencies = {}): Hono<ApiEnv> {
  const app = new Hono<ApiEnv>();
  const origins = configuredOrigins();

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

  for (const [method, path] of authRoutes) {
    app.on(method, path, (context) => (dependencies.authHandler ?? auth.handler)(context.req.raw));
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
