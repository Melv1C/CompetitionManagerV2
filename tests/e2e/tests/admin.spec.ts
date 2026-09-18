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
    await expect(page.getByRole("link", { name: /Manage Organizations/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Frontend App/i })).toBeVisible();
  });

  test("can create an organization for another user", async ({ browser, page }) => {
    const organizationName = `E2E Athletics ${Date.now()}`;
    const organizationSlug = organizationName.toLowerCase().replaceAll(" ", "-");

    await page.goto(`${E2E_URLS.admin}/organizations`);

    await expect(page.getByRole("heading", { name: "Organizations" })).toBeVisible();
    await page.getByRole("button", { name: "Create organization" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill(organizationName);
    await expect(page.getByRole("textbox", { name: "Slug" })).toHaveValue(organizationSlug);
    await page.getByRole("textbox", { name: "Search owners" }).fill("user.e2e@example.com");
    await page.getByRole("combobox", { name: "Owner" }).click();
    await page.getByRole("option", { name: /E2E User.*user\.e2e@example\.com/ }).click();
    await page.getByRole("button", { name: "Create organization", exact: true }).click();

    const organizationRow = page.getByRole("row", { name: new RegExp(organizationName) });
    await expect(organizationRow).toContainText(organizationSlug);
    await expect(organizationRow).toContainText("E2E User");
    await expect(organizationRow).toContainText("user.e2e@example.com");

    const ownerContext = await browser.newContext({ storageState: E2E_AUTH_FILES.user });
    const managerPage = await ownerContext.newPage();
    await managerPage.goto(E2E_URLS.manager);
    await expect(managerPage).toHaveURL(`${E2E_URLS.manager}/`);
    await expect(managerPage.getByRole("heading", { name: /Welcome to/i })).toBeVisible();
    await ownerContext.close();
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
