/// <reference types="node" />

import { expect, test, type Page } from "@playwright/test";

import { database } from "../../apps/api/src/infrastructure/database";

const adminUrl = process.env.E2E_ADMIN_URL ?? "http://localhost:3003";
const managerUrl = process.env.E2E_MANAGER_URL ?? "http://localhost:3002";

async function waitForSessionHydration(page: Page): Promise<void> {
  await expect(page.locator('[data-session-hydrated="true"]')).toBeVisible();
}

test("platform admin creates an Organization for an existing owner who can reload manager access", async ({
  browser,
}) => {
  const runId = crypto.randomUUID();
  const ownerEmail = `organization-owner-${runId}@example.test`;
  const adminEmail = `organization-admin-${runId}@example.test`;
  const organizationSlug = `brussels-athletics-organization-${runId.slice(0, 8)}`;
  const password = "correct horse battery";
  const ownerContext = await browser.newContext();
  const adminContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  const adminPage = await adminContext.newPage();
  try {
    await ownerPage.goto(managerUrl);
    await waitForSessionHydration(ownerPage);
    await ownerPage.getByRole("heading", { name: "Create your account" }).waitFor();
    await ownerPage.getByLabel("Name").fill("Organization Owner");
    await ownerPage.getByLabel("Email").fill(ownerEmail);
    await ownerPage.getByLabel("Password").fill(password);
    await ownerPage.getByRole("button", { name: "Create account" }).click();
    await expect(
      ownerPage.getByRole("region", { name: "Pending email verification" }),
    ).toBeVisible();
    const owner = await database.user.update({
      where: { email: ownerEmail },
      data: { emailVerified: true },
    });

    await ownerPage.getByRole("button", { name: "Sign out" }).click();
    await adminPage.goto(adminUrl);
    await waitForSessionHydration(adminPage);
    await adminPage.getByRole("heading", { name: "Create your account" }).waitFor();
    await adminPage.getByLabel("Name").fill("Platform Admin");
    await adminPage.getByLabel("Email").fill(adminEmail);
    await adminPage.getByLabel("Password").fill(password);
    await adminPage.getByRole("button", { name: "Create account" }).click();
    await expect(
      adminPage.getByRole("region", { name: "Pending email verification" }),
    ).toBeVisible();
    await database.user.update({
      where: { email: adminEmail },
      data: { emailVerified: true, role: "admin" },
    });
    await adminPage.reload();
    await waitForSessionHydration(adminPage);

    await expect(adminPage.getByRole("region", { name: "Platform admin dashboard" })).toBeVisible();
    await adminPage.getByLabel("Organization name").fill("Brussels Athletics Organization");
    await adminPage.getByLabel("Organization slug").fill(organizationSlug);
    await adminPage.route("**/api/v1/admin/users?query=*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.continue();
    });
    await adminPage.getByLabel("Search eligible owner").fill(ownerEmail);
    await expect(adminPage.getByText("Searching eligible owners…")).toBeVisible();
    await adminPage.getByRole("button", { name: "Organization Owner" }).click();
    await adminPage.getByRole("button", { name: "Create Organization" }).click();
    await expect(
      adminPage.getByRole("status", { name: "Organization creation notice" }),
    ).toContainText("Organization “Brussels Athletics Organization” created successfully.");

    await ownerPage.goto(managerUrl);
    await waitForSessionHydration(ownerPage);
    const authentication = ownerPage.getByRole("region", { name: "Authentication" });
    if (await authentication.isVisible()) {
      await ownerPage.getByRole("heading", { name: "Create your account" }).waitFor();
      const signInToggle = ownerPage.getByRole("button", {
        name: "Already have an account? Sign in",
      });
      await expect(signInToggle).toBeVisible();
      await signInToggle.click();
      await ownerPage.getByLabel("Email").fill(ownerEmail);
      await ownerPage.getByLabel("Password").fill(password);
      await ownerPage.getByRole("button", { name: "Sign in" }).click();
    }
    await expect(
      ownerPage.locator('[aria-label="Authenticated session"][data-session-hydrated="true"]'),
    ).toBeVisible();

    const managerDashboard = ownerPage.getByRole("region", {
      name: "Organization manager dashboard",
    });
    await expect(managerDashboard).toContainText("Brussels Athletics Organization");
    await expect(ownerPage).toHaveURL(/\/organizations\/[^/]+$/);

    await ownerPage.reload();
    await expect(
      ownerPage.getByRole("region", { name: "Organization manager dashboard" }),
    ).toContainText("Brussels Athletics Organization");
    expect(owner.id).toBeTruthy();
  } finally {
    const organization = await database.organization
      .findUnique({ where: { slug: organizationSlug }, select: { id: true } })
      .catch(() => null);
    if (organization) {
      await database.organization.delete({ where: { id: organization.id } }).catch(() => undefined);
    }
    await database.user
      .deleteMany({ where: { email: { in: [ownerEmail, adminEmail] } } })
      .catch(() => undefined);
    await ownerContext.close();
    await adminContext.close();
    await database.$disconnect();
  }
});
