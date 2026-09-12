import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { database } from "../infrastructure/database";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.BACKEND_URL ?? "http://localhost:3000",
  database: prismaAdapter(database, {
    provider: "postgresql",
  }),
});
