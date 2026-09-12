import {
  healthRequestSchema,
  liveHealthSchema,
  operationsHealthSchema,
  readyHealthSchema,
  type QueueHealth,
} from "@competition-manager/contracts";
import { Hono } from "hono";
import type { Handler, MiddlewareHandler } from "hono";

import {
  apiErrorMiddleware,
  handleApiError,
  notFoundResponse,
  RequestValidationError,
  type ApiEnv,
} from "./errors";

export type DependencyProbe = () => Promise<boolean>;

export type HealthDependencies = {
  database: DependencyProbe;
  redis: DependencyProbe;
  queue?: () => Promise<QueueHealth>;
};

function timestamp(): string {
  return new Date().toISOString();
}

export function createHealthApp(dependencies: HealthDependencies): Hono<ApiEnv> {
  const app = new Hono<ApiEnv>();
  app.use("*", apiErrorMiddleware());
  app.onError(handleApiError);
  app.notFound(notFoundResponse);

  const validateHealthRequest: MiddlewareHandler = async (context, next) => {
    const result = healthRequestSchema.safeParse(context.req.query());
    if (!result.success) throw new RequestValidationError(result.error);
    await next();
  };

  const live: Handler = (context) => {
    const response = liveHealthSchema.parse({
      status: "ok",
      service: "backend",
      timestamp: timestamp(),
    });
    return context.json(response, 200);
  };

  const ready: Handler = async (context) => {
    const [database, redis] = await Promise.all([
      dependencies.database().catch(() => false),
      dependencies.redis().catch(() => false),
    ]);
    const response = readyHealthSchema.parse({
      status: database && redis ? "ready" : "not_ready",
      service: "backend",
      checks: {
        database: database ? "ok" : "unavailable",
        redis: redis ? "ok" : "unavailable",
      },
      timestamp: timestamp(),
    });
    return context.json(response, database && redis ? 200 : 503);
  };

  const operations: Handler = async (context) => {
    const queue = await (dependencies.queue?.() ??
      Promise.resolve({ available: false, depth: 0, failedJobs: 0 }));
    const response = operationsHealthSchema.parse({
      service: "backend",
      queue,
      timestamp: timestamp(),
    });
    return context.json(response, queue.available ? 200 : 503);
  };

  for (const prefix of ["/health", "/api/v1/health"]) {
    app.get(`${prefix}/live`, validateHealthRequest, live);
    app.get(`${prefix}/ready`, validateHealthRequest, ready);
    app.get(`${prefix}/operations`, validateHealthRequest, operations);
  }

  return app;
}
