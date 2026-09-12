/// <reference types="node" />

import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);
const apiUrl = process.env.E2E_API_URL ?? "http://localhost:3000";
const frontendUrl = process.env.E2E_FRONTEND_URL ?? "http://localhost:3001";
const managerUrl = process.env.E2E_MANAGER_URL ?? "http://localhost:3002";
const adminUrl = process.env.E2E_ADMIN_URL ?? "http://localhost:3003";

const webServerDefaults = {
  reuseExistingServer: !isCI,
  timeout: 120_000,
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? "github" : "list",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      ...webServerDefaults,
      command: "bunx varlock run --path apps/api -- bun run --cwd apps/api dev",
      url: `${apiUrl}/health/ready`,
    },
    {
      ...webServerDefaults,
      command:
        "bunx varlock run --path apps/frontend -- bun run --cwd apps/frontend dev -- --host 127.0.0.1",
      url: frontendUrl,
    },
    {
      ...webServerDefaults,
      command:
        "bunx varlock run --path apps/manager -- bun run --cwd apps/manager dev -- --host 127.0.0.1",
      url: managerUrl,
    },
    {
      ...webServerDefaults,
      command:
        "bunx varlock run --path apps/admin -- bun run --cwd apps/admin dev -- --host 127.0.0.1",
      url: adminUrl,
    },
  ],
});
