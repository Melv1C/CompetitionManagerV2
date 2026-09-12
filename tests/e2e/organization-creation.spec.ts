/// <reference types="node" />

import { expect, test } from "@playwright/test";

import { database } from "../../apps/api/src/infrastructure/database";

const adminUrl = process.env.E2E_ADMIN_URL ?? "http://localhost:3003";
const managerUrl = process.env.E2E_MANAGER_URL ?? "http://localhost:3002";

test("platform admin creates an Organization for an existing owner who can reload manager access", async ({
  browser,
}) => {
  const ownerEmail = `organization-owner-${Date.now()}@example.test`;
  const adminEmail = `organization-admin-${Date.now()}@example.test`;
  const password = "correct horse battery";
  const ownerContext = await browser.newContext();
  const adminContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  const adminPage = await adminContext.newPage();
  let organizationId: string | undefined;

  try {
    await ownerPage.goto(managerUrl);
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

    await expect(adminPage.getByRole("region", { name: "Platform admin dashboard" })).toBeVisible();
    await adminPage.getByLabel("Organization name").fill("Brussels Athletics Organization");
    await adminPage.getByLabel("Organization slug").fill("brussels-athletics-organization");
    await adminPage.getByLabel("Search eligible owner").fill(ownerEmail);
    await adminPage.getByRole("button", { name: "Organization Owner" }).click();
    await adminPage.getByRole("button", { name: "Create Organization" }).click();
    await expect(adminPage.getByRole("status")).toContainText(
      "Organization “Brussels Athletics Organization” created successfully.",
    );

    await ownerPage.goto(managerUrl);
    await ownerPage.getByRole("heading", { name: "Create your account" }).waitFor();
    await ownerPage.getByRole("button", { name: "Already have an account? Sign in" }).click();
    await ownerPage.getByLabel("Email").fill(ownerEmail);
    await ownerPage.getByLabel("Password").fill(password);
    await ownerPage.getByRole("button", { name: "Sign in" }).click();

    const managerDashboard = ownerPage.getByRole("region", {
      name: "Organization manager dashboard",
    });
    await expect(managerDashboard).toContainText("Brussels Athletics Organization");
    await expect(ownerPage).toHaveURL(/\/organizations\/[^/]+$/);
    organizationId = new URL(ownerPage.url()).pathname.split("/").pop();

    await ownerPage.reload();
    await expect(
      ownerPage.getByRole("region", { name: "Organization manager dashboard" }),
    ).toContainText("Brussels Athletics Organization");
    expect(owner.id).toBeTruthy();
  } finally {
    if (organizationId) {
      await database.organization.delete({ where: { id: organizationId } }).catch(() => undefined);
    }
    await database.user.deleteMany({ where: { email: { in: [ownerEmail, adminEmail] } } });
    await ownerContext.close();
    await adminContext.close();
    await database.$disconnect();
  }
});
