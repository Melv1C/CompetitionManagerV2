/// <reference types="node" />

import { expect, test } from "@playwright/test";

import { database } from "../../apps/api/src/infrastructure/database";

const managerUrl = process.env.E2E_MANAGER_URL ?? "http://localhost:3002";
test.afterAll(async () => {
  await database.$disconnect();
});

test("verified user creates a Club and reloads its manager dashboard", async ({ page }) => {
  const email = `club-browser-${Date.now()}@example.test`;
  await page.goto(managerUrl);

  await page.getByRole("heading", { name: "Create your account" }).waitFor();
  await page.getByLabel("Name").fill("Club Browser User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("region", { name: "Pending email verification" })).toBeVisible();

  // The test fixture completes the verification boundary without depending on email transport.
  await database.user.update({ where: { email }, data: { emailVerified: true } });
  await page.reload();

  await expect(page.getByRole("region", { name: "Club setup" })).toBeVisible();
  await page.getByLabel("Club name").fill("Brussels Athletics Club");
  await page.getByRole("button", { name: "Create Club" }).click();

  await expect(page).toHaveURL(/\/clubs\/[^/]+$/);
  await expect(page.getByRole("region", { name: "Club manager dashboard" })).toContainText(
    "Brussels Athletics Club",
  );

  await page.reload();
  await expect(page.getByRole("region", { name: "Club manager dashboard" })).toContainText(
    "Brussels Athletics Club",
  );

  await database.user.delete({ where: { email } });
});
