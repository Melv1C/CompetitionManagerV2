import { organizationAccessControl, organizationRoles } from "@repo/utils";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ENV } from "varlock/env";

export const authClient = createAuthClient({
  baseURL: ENV.API_URL,
  plugins: [
    adminClient(),
    organizationClient({ ac: organizationAccessControl, roles: organizationRoles }),
  ],
});

export const { signIn, signOut, useSession } = authClient;
