import { Hono } from "hono";

import { liveHealthSchema, readyHealthSchema } from "@competition-manager/contracts";

export type DependencyProbe = () => Promise<boolean>;

export type HealthDependencies = {
  database: DependencyProbe;
  redis: DependencyProbe;
};

function timestamp(): string {
  return new Date().toISOString();
}

export function createHealthApp(dependencies: HealthDependencies): Hono {
  const app = new Hono();

  app.get("/health/live", (context) => {
    const response = liveHealthSchema.parse({
      status: "ok",
      service: "backend",
      timestamp: timestamp(),
    });
    return context.json(response, 200);
  });

  app.get("/health/ready", async (context) => {
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
  });

  return app;
}
