import { expect, test } from "@playwright/test";

import { E2E_AUTH_FILES, E2E_URLS } from "./constants";

test("frontend app redirects anonymous users to login", async ({ page }) => {
  await page.goto(E2E_URLS.frontend);

  await expect(page).toHaveURL(`${E2E_URLS.frontend}/login`);
  await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
});

test.describe("as user", () => {
  test.use({ storageState: E2E_AUTH_FILES.user });

  test("can open the frontend home page", async ({ page }) => {
    await page.goto(E2E_URLS.frontend);

    await expect(page.getByRole("heading", { name: /Welcome to/i })).toBeVisible();
    await expect(page.getByText("Environment: test")).toBeVisible();
  });
});
