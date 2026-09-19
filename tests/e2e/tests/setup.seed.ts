import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
} from "@playwright/test";

import { E2E_AUTH_FILES, E2E_URLS, E2E_USERS } from "./constants";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));

async function waitForApi(request: APIRequestContext) {
  await expect
    .poll(
      async () => {
        try {
          const response = await request.get(`${E2E_URLS.api}/api/health`);
          return response.status();
        } catch {
          return 0;
        }
      },
      { timeout: 60000 },
    )
    .toBe(200);
}

async function authenticate(email: string, password: string, authFile: string) {
  mkdirSync(dirname(authFile), { recursive: true });

  const context = await playwrightRequest.newContext({
    baseURL: E2E_URLS.api,
    storageState: undefined,
  });

  try {
    const response = await context.post("/api/auth/sign-in/email", {
      data: { email, password },
    });

    if (!response.ok()) {
      throw new Error(
        `Failed to authenticate ${email}: ${response.status()} ${await response.text()}`,
      );
    }

    await context.storageState({ path: authFile });
    return (await response.json()) as { user: { id: string } };
  } finally {
    await context.dispose();
  }
}

async function ensureUser(
  request: APIRequestContext,
  user: { readonly name: string; readonly email: string; readonly password: string },
  authFile: string,
) {
  try {
    return await authenticate(user.email, user.password, authFile);
  } catch {
    // User does not exist yet, create it below.
  }

  const response = await request.post(`${E2E_URLS.api}/api/auth/sign-up/email`, {
    data: user,
  });

  if (!response.ok()) {
    throw new Error(`Failed to create e2e user: ${response.status()} ${await response.text()}`);
  }

  return authenticate(user.email, user.password, authFile);
}

async function setEmailVerified(userId: string, emailVerified: boolean) {
  const context = await playwrightRequest.newContext({
    baseURL: E2E_URLS.api,
    storageState: E2E_AUTH_FILES.admin,
  });

  try {
    const response = await context.post("/api/auth/admin/update-user", {
      data: { userId, data: { emailVerified } },
    });

    if (!response.ok()) {
      throw new Error(
        `Failed to update email verification: ${response.status()} ${await response.text()}`,
      );
    }
  } finally {
    await context.dispose();
  }
}

async function ensureUnverifiedOrganizationOwner(userId: string) {
  const context = await playwrightRequest.newContext({
    baseURL: E2E_URLS.api,
    storageState: E2E_AUTH_FILES.admin,
  });

  try {
    await setEmailVerified(userId, true);
    const response = await context.post("/api/organizations", {
      data: {
        name: "E2E Unverified Owner Organization",
        slug: "e2e-unverified-owner-organization",
        ownerId: userId,
      },
    });

    if (response.status() !== 201 && response.status() !== 409) {
      throw new Error(
        `Failed to create unverified-owner fixture: ${response.status()} ${await response.text()}`,
      );
    }
  } finally {
    await setEmailVerified(userId, false);
    await context.dispose();
  }
}

async function ensureOrganization(name: string, slug: string, ownerId: string) {
  const context = await playwrightRequest.newContext({
    baseURL: E2E_URLS.api,
    storageState: E2E_AUTH_FILES.admin,
  });
  try {
    const response = await context.post("/api/organizations", {
      data: { name, slug, ownerId },
    });
    if (response.status() !== 201 && response.status() !== 409) {
      throw new Error(
        `Failed to create Organization fixture: ${response.status()} ${await response.text()}`,
      );
    }
  } finally {
    await context.dispose();
  }
}

test("seed and authenticate e2e users", async ({ request }) => {
  await waitForApi(request);

  execFileSync(
    "docker",
    [
      "compose",
      "-f",
      "docker-compose.e2e.yml",
      "exec",
      "-T",
      "api",
      "bun",
      "--filter=api",
      "run",
      "add-admin",
      "--",
      E2E_USERS.admin.name,
      E2E_USERS.admin.email,
      E2E_USERS.admin.password,
    ],
    {
      cwd: repoRoot,
      stdio: "inherit",
    },
  );

  await authenticate(E2E_USERS.admin.email, E2E_USERS.admin.password, E2E_AUTH_FILES.admin);
  const verifiedUser = await ensureUser(request, E2E_USERS.user, E2E_AUTH_FILES.user);
  const competitionOwner = await ensureUser(
    request,
    E2E_USERS.competitionOwner,
    E2E_AUTH_FILES.competitionOwner,
  );
  const unverifiedUser = await ensureUser(
    request,
    E2E_USERS.unverifiedUser,
    E2E_AUTH_FILES.unverifiedUser,
  );
  const staff = await ensureUser(request, E2E_USERS.staff, E2E_AUTH_FILES.staff);
  const member = await ensureUser(request, E2E_USERS.member, E2E_AUTH_FILES.member);
  const secondOwner = await ensureUser(request, E2E_USERS.secondOwner, E2E_AUTH_FILES.secondOwner);

  await Promise.all([
    setEmailVerified(verifiedUser.user.id, true),
    setEmailVerified(competitionOwner.user.id, true),
    setEmailVerified(staff.user.id, true),
    setEmailVerified(member.user.id, true),
    setEmailVerified(secondOwner.user.id, true),
  ]);
  await ensureOrganization(
    "E2E Athletics Organization",
    "e2e-athletics-organization",
    competitionOwner.user.id,
  );
  await ensureOrganization(
    "E2E Secondary Organization",
    "e2e-secondary-organization",
    secondOwner.user.id,
  );
  await ensureUnverifiedOrganizationOwner(unverifiedUser.user.id);

  execFileSync(
    "docker",
    [
      "compose",
      "-f",
      "docker-compose.e2e.yml",
      "exec",
      "-T",
      "api",
      "bun",
      "--filter=api",
      "run",
      "seed-e2e",
    ],
    { cwd: repoRoot, stdio: "inherit" },
  );
});
