import { defineConfig, devices } from "@playwright/test";

import { E2E_URLS } from "@/constants";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "setup",
      testMatch: /setup\.seed\.ts/,
    },
    {
      name: "chromium",
      testIgnore: /setup\.seed\.ts/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: "docker compose -f ../../docker-compose.e2e.yml up --build",
    url: E2E_URLS.frontend,
    reuseExistingServer: !process.env.CI,
    timeout: 300000, // Cold CI builds create three images before the frontend is reachable.
    // Gracefully shut down the docker container
    gracefulShutdown: {
      signal: "SIGTERM",
      timeout: 5000, // Give Docker 5 seconds to shut down before forcing a SIGKILL
    },
  },
});
