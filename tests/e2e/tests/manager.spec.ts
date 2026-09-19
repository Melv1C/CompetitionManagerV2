import { expect, test } from "@playwright/test";

import { E2E_AUTH_FILES, E2E_URLS } from "./constants";

test.describe("manager access", () => {
  test.use({ storageState: E2E_AUTH_FILES.unverifiedUser });

  test("denies an unverified organization owner", async ({ page }) => {
    await page.goto(E2E_URLS.manager);

    await expect(page).toHaveURL(`${E2E_URLS.manager}/unauthorized`);
    await expect(page.getByRole("heading", { name: "Manager access unavailable" })).toBeVisible();
  });
});
