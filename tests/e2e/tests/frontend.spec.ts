import { expect, test } from "@playwright/test";

import { E2E_URLS } from "./constants";

test("frontend home page renders", async ({ page }) => {
  await page.goto(E2E_URLS.frontend);

  await expect(page.getByRole("heading", { name: /Welcome to/i })).toBeVisible();
  await expect(page.getByText("Environment: test")).toBeVisible();
});
