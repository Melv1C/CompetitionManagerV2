import { z } from "zod";

export const healthStatusSchema = z.enum(["ok", "ready", "not_ready"]);
export const dependencyStatusSchema = z.enum(["ok", "unavailable"]);

export const healthRequestSchema = z.object({}).strict();

export const liveHealthSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("backend"),
  timestamp: z.string().datetime(),
});

export const readyHealthSchema = z.object({
  status: z.enum(["ready", "not_ready"]),
  service: z.literal("backend"),
  checks: z.object({
    database: dependencyStatusSchema,
    redis: dependencyStatusSchema,
  }),
  timestamp: z.string().datetime(),
});

export type LiveHealth = z.infer<typeof liveHealthSchema>;
export type ReadyHealth = z.infer<typeof readyHealthSchema>;
