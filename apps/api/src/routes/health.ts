import { Hono } from "hono";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const healthRoutes = new Hono().get("/", async (c) => {
  logger.info("Health check requested");
  let isDatabaseConnected = false;

  try {
    const result = await prisma.$queryRaw`SELECT 1`; // Simple query to check database connectivity;
    isDatabaseConnected = !!result;
  } catch {
    isDatabaseConnected = false;
  }

  logger.info("Database connectivity check completed", {
    metadata: { isDatabaseConnected: !!isDatabaseConnected },
  });
  return c.json(
    {
      status: isDatabaseConnected ? "ok" : "error",
      database: isDatabaseConnected ? "connected" : "disconnected",
    },
    isDatabaseConnected ? 200 : 503,
  );
});
