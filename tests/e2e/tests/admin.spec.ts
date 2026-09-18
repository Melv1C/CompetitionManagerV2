import { expect, test } from "@playwright/test";

import { E2E_AUTH_FILES, E2E_URLS } from "./constants";

test("admin app redirects anonymous users to login", async ({ page }) => {
  await page.goto(E2E_URLS.admin);

  await expect(page).toHaveURL(`${E2E_URLS.admin}/login`);
  await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
});

test.describe("as admin", () => {
  test.use({ storageState: E2E_AUTH_FILES.admin });

  test("can open the admin dashboard", async ({ page }) => {
    await page.goto(E2E_URLS.admin);

    await expect(page.getByText("Quick Actions")).toBeVisible();
    await expect(page.getByRole("link", { name: /Manage Users/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Frontend App/i })).toBeVisible();
  });
});

test.describe("as user", () => {
  test.use({ storageState: E2E_AUTH_FILES.user });

  test("cannot open the admin dashboard", async ({ page }) => {
    await page.goto(E2E_URLS.admin);

    await expect(page).toHaveURL(`${E2E_URLS.admin}/unauthorized`);
    await expect(page.getByRole("heading", { name: "This account is not an admin" })).toBeVisible();
  });
});
