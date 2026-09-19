import { Hono } from "hono";

import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { isAdmin, isVerified, useAuth } from "@/middlewares/use-auth";
import { useLogger } from "@/middlewares/use-logger";

import { healthRoutes } from "./health";
import { organizationsRoutes } from "./organizations";

export const routes = new Hono()
  .use(useAuth)
  .post("/studio", isAdmin, async (c) => {
    const { query } = await c.req.json();
    const results = await prisma.$queryRawUnsafe(query.sql, ...query.parameters);
    return c.json([null, results]);
  })
  .use("/auth/organization/*", isVerified)
  .on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw))
  //////////////////////////////////////////////////
  // Add routes without logging middleware here
  //////////////////////////////////////////////////
  .use("*", useLogger)
  //////////////////////////////////////////////////
  // Add routes with logging middleware applied here
  .route("/health", healthRoutes)
  .route("/organizations", organizationsRoutes)

  //////////////////////////////////////////////////
  // Global error handler
  .onError((err, c) => {
    logger.error("Unhandled error occurred", {
      metadata: { error: err.message, stack: err.stack, ctx: err.cause, name: err.name },
    });
    return c.json({ message: "Internal Server Error" }, 500);
  });
