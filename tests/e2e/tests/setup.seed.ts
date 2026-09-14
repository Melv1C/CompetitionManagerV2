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

async function waitForBackend(request: APIRequestContext) {
  await expect
    .poll(
      async () => {
        try {
          const response = await request.get(`${E2E_URLS.backend}/api/health`);
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
    baseURL: E2E_URLS.backend,
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
  } finally {
    await context.dispose();
  }
}

async function ensureUser(request: APIRequestContext) {
  try {
    await authenticate(E2E_USERS.user.email, E2E_USERS.user.password, E2E_AUTH_FILES.user);
    return;
  } catch {
    // User does not exist yet, create it below.
  }

  const response = await request.post(`${E2E_URLS.backend}/api/auth/sign-up/email`, {
    data: E2E_USERS.user,
  });

  if (!response.ok()) {
    throw new Error(`Failed to create e2e user: ${response.status()} ${await response.text()}`);
  }

  await authenticate(E2E_USERS.user.email, E2E_USERS.user.password, E2E_AUTH_FILES.user);
}

test("seed and authenticate e2e users", async ({ request }) => {
  await waitForBackend(request);

  execFileSync(
    "docker",
    [
      "compose",
      "-f",
      "docker-compose.e2e.yml",
      "exec",
      "-T",
      "backend",
      "bun",
      "--filter=backend",
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

  await waitForBackend(request);
  await ensureUser(request);
  await authenticate(E2E_USERS.admin.email, E2E_USERS.admin.password, E2E_AUTH_FILES.admin);
});
