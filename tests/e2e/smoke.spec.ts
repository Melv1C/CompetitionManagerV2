/// <reference types="node" />

import { expect, test } from "@playwright/test";

const apiBaseUrl = process.env.E2E_API_URL ?? "http://localhost:3000";
const frontendUrl = process.env.E2E_FRONTEND_URL ?? "http://localhost:3001";
const managerUrl = process.env.E2E_MANAGER_URL ?? "http://localhost:3002";
const adminUrl = process.env.E2E_ADMIN_URL ?? "http://localhost:3003";

const surfaces = [
  { name: "frontend", url: frontendUrl, heading: "Public competition access" },
  { name: "manager", url: managerUrl, heading: "manager application" },
  { name: "admin", url: adminUrl, heading: "admin application" },
] as const;

for (const surface of surfaces) {
  test(`${surface.name} surface renders its application identity`, async ({ page }) => {
    await page.goto(surface.url);

    await expect(page.getByRole("heading", { name: surface.heading })).toBeVisible();
  });
}

test("API liveness and readiness contracts are reachable", async ({ request }) => {
  const liveResponse = await request.get(`${apiBaseUrl}/health/live`);
  expect(liveResponse.status()).toBe(200);
  expect(await liveResponse.json()).toMatchObject({
    status: "ok",
    service: "backend",
  });

  const readyResponse = await request.get(`${apiBaseUrl}/health/ready`);
  expect(readyResponse.status()).toBe(200);
  expect(await readyResponse.json()).toMatchObject({
    status: "ready",
    service: "backend",
    checks: { database: "ok", redis: "ok" },
  });
});

test("registration keeps the authenticated session after a page reload", async ({ page }) => {
  const email = `browser-${Date.now()}@example.test`;

  await page.goto(frontendUrl);
  await page.getByRole("heading", { name: "Create your account" }).waitFor();
  await page.getByLabel("Name").fill("Browser Test User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();

  const session = page.getByRole("region", { name: "Authenticated session" });
  await expect(session).toContainText(email);
  await expect(session).toContainText("Email verification is required");

  await page.reload();
  await expect(page.getByRole("region", { name: "Authenticated session" })).toContainText(email);
});
