import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3_000),
  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://competition:competition@localhost:5432/competition_manager"),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  PUBLIC_BACKEND_URL: z.string().url().default("http://localhost:3000"),
  VITE_BACKEND_URL: z.string().url().default("http://localhost:3000"),
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(source: Record<string, string | undefined>): Environment {
  return environmentSchema.parse(source);
}

export function environmentTemplate(): string {
  return [
    "# Generated from packages/config-env/src/index.ts",
    "NODE_ENV=development",
    "PORT=3000",
    "DATABASE_URL=postgresql://competition:competition@localhost:5432/competition_manager",
    "REDIS_URL=redis://localhost:6379",
    "PUBLIC_BACKEND_URL=http://localhost:3000",
    "VITE_BACKEND_URL=http://localhost:3000",
    "",
  ].join("\n");
}
