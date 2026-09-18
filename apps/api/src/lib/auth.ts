import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, organization } from "better-auth/plugins";
import { ENV } from "varlock/env";

import { prismaWithoutLog } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prismaWithoutLog, {
    provider: "postgresql",
  }),
  secret: ENV.BETTER_AUTH_SECRET,
  baseURL: ENV.API_URL,
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [ENV.FRONTEND_URL, ENV.MANAGER_URL, ENV.ADMIN_URL],
  plugins: [admin(), organization({ allowUserToCreateOrganization: false })],
});
