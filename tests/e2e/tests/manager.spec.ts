import { expect, test, type Page } from "@playwright/test";

import { E2E_AUTH_FILES, E2E_CATALOG_IDS, E2E_URLS, E2E_USERS } from "./constants";

test.describe("manager competition setup", () => {
  test.describe.configure({ mode: "serial" });

  let primaryOrganizationId = "";

  test.use({ storageState: E2E_AUTH_FILES.competitionOwner });

  test("an Organization Owner configures and publishes a Competition", async ({ page }) => {
    await page.goto(E2E_URLS.manager);
    await expect(page.getByRole("heading", { name: "Competitions" })).toBeVisible();
    primaryOrganizationId = organizationIdFrom(page.url());
    await expect(
      page.getByRole("button", { name: "Organization: E2E Athletics Organization" }),
    ).toBeVisible();

    const competitionName = `E2E Brussels Meeting ${Date.now()}`;
    await createDraft(page, competitionName);
    await expect(page.getByRole("heading", { name: competitionName })).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish Competition" })).toBeDisabled();

    await page.getByLabel("Competition starts").fill("2027-06-12T09:00");
    await page.getByLabel("Competition ends").fill("2027-06-12T18:00");
    await page.getByLabel("Registration opens").fill("2027-05-01T09:00");
    await page.getByLabel("Registration closes").fill("2027-06-10T23:00");
    await page.getByLabel("Contact name").fill("Morgan Meet Director");
    await page.getByLabel("Contact email").fill("meet@example.com");
    await page.getByLabel("Contact phone").fill("+32 2 555 01 01");
    await page.getByLabel("Venue name").fill("King Baudouin Stadium");
    await page.getByLabel("Address line 1").fill("Marathonlaan 135");
    await page.getByLabel("Postal code").fill("1020");
    await page.getByLabel("City").fill("Brussels");
    await page.getByRole("switch").click();
    await page.getByLabel("First bib").fill("9000");
    await page.getByLabel("Last bib").fill("9099");
    await page.getByText("Brussels Athletics · BRU").click();
    await page.getByRole("button", { name: "Save details" }).click();
    await expect(page.getByText("Details saved", { exact: true })).toBeVisible();

    await page.getByRole("tab", { name: "Pricing" }).click();
    await page.getByRole("button", { name: "Add tier" }).click();
    await page.getByLabel("Tier name", { exact: true }).fill("Belgian clubs");
    await page.getByText("Brussels Athletics", { exact: true }).last().click();
    await page.getByRole("button", { name: "Save pricing" }).click();
    await expect(page.getByText("Pricing Tiers saved", { exact: true })).toBeVisible();

    await page.getByRole("tab", { name: "Events & schedule" }).click();
    await addEvent(page, {
      discipline: "100 metres",
      name: "100 metres sprint",
      category: "Senior men",
      roundStart: "2027-06-12T10:00",
      prices: ["12.00", "8.00"],
      startGroup: true,
    });
    await addEvent(page, {
      discipline: "4 × 100 metres relay",
      name: "4 × 100 metres relay",
      category: "Senior women",
      roundStart: "2027-06-12T16:00",
      prices: ["24.00", "20.00"],
      relay: true,
    });

    await page.getByRole("button", { name: "Edit" }).first().click();
    await page.getByRole("dialog").getByLabel("Description").fill("Championship sprint Final");
    await page.getByRole("dialog").getByRole("button", { name: "Save Event" }).click();
    await expect(page.getByText("Event saved")).toBeVisible();

    await expect(
      page.getByText("This Competition has everything required for publication."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Publish Competition" }).click();
    await expect(page.getByText("Competition published")).toBeVisible();
    await expect(page.getByText("PUBLISHED", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete Draft" })).toHaveCount(0);

    const competitionId = page.url().split("/").at(-1)!;
    const audit = await page.request.get(
      `${E2E_URLS.api}/api/manager/organizations/${primaryOrganizationId}/competitions/${competitionId}/audit`,
    );
    expect(audit.ok()).toBeTruthy();
    const auditBody = (await audit.json()) as {
      entries: Array<{ entityType: string; action: string }>;
    };
    expect(auditBody.entries.map((entry) => entry.action)).toEqual(
      expect.arrayContaining(["CREATE", "UPDATE", "STATE_TRANSITION"]),
    );
    expect(auditBody.entries).toContainEqual(
      expect.objectContaining({ entityType: "COMPETITION_EVENT", action: "UPDATE" }),
    );
  });

  test("rejects Event catalog references owned by another Organization", async ({ page }) => {
    await page.goto(E2E_URLS.manager);
    await createDraft(page, `E2E tenant boundary ${Date.now()}`);
    const organizationId = organizationIdFrom(page.url());
    const competitionId = page.url().split("/").at(-1)!;
    const detailResponse = await page.request.get(
      `${E2E_URLS.api}/api/manager/organizations/${organizationId}/competitions/${competitionId}`,
    );
    expect(detailResponse.ok()).toBeTruthy();
    const { competition } = (await detailResponse.json()) as {
      competition: { updatedAt: string };
    };
    const eventUrl = `${E2E_URLS.api}/api/manager/organizations/${organizationId}/competitions/${competitionId}/events`;
    const eventInput = {
      expectedUpdatedAt: competition.updatedAt,
      kind: "INDIVIDUAL",
      relayLegCount: null,
      resultEntryMode: "COMPETITION_MANAGER_WEB",
      registerable: false,
      capacity: null,
      translations: [{ locale: "EN", name: "Tenant boundary Event", description: "" }],
      prices: [],
      rounds: [
        {
          label: "Final",
          scheduledStartAt: "2027-06-12T10:00:00.000Z",
          startGroups: [],
        },
      ],
    };

    const foreignDiscipline = await page.request.post(eventUrl, {
      data: {
        ...eventInput,
        disciplineId: E2E_CATALOG_IDS.secondaryOrganizationDiscipline,
        athleteCategoryIds: [E2E_CATALOG_IDS.athleteCategory],
      },
    });
    expect(foreignDiscipline.status()).toBe(400);
    await expect(foreignDiscipline.json()).resolves.toMatchObject({
      error: "Discipline is not available to this Organization",
    });

    const foreignCategory = await page.request.post(eventUrl, {
      data: {
        ...eventInput,
        disciplineId: E2E_CATALOG_IDS.discipline,
        athleteCategoryIds: [E2E_CATALOG_IDS.secondaryOrganizationAthleteCategory],
      },
    });
    expect(foreignCategory.status()).toBe(400);
    await expect(foreignCategory.json()).resolves.toMatchObject({
      error: "Athlete Category is not available to this Organization and Athletics Season",
    });
  });

  test("stale edits are rejected and staff can delete an accidental Draft", async ({ browser }) => {
    const context = await browser.newContext({ storageState: E2E_AUTH_FILES.staff });
    const firstPage = await context.newPage();
    await firstPage.goto(E2E_URLS.manager);
    await expect(firstPage.getByRole("heading", { name: "Competitions" })).toBeVisible();
    await createDraft(firstPage, `E2E disposable Draft ${Date.now()}`);
    const draftUrl = firstPage.url();
    const draftOrganizationId = organizationIdFrom(draftUrl);
    const competitionId = draftUrl.split("/").at(-1)!;

    const stalePage = await context.newPage();
    await stalePage.goto(draftUrl);
    await expect(stalePage.getByRole("tab", { name: "Details" })).toBeVisible();

    await firstPage.getByLabel("Contact name").fill("First editor");
    await firstPage.getByRole("button", { name: "Save details" }).click();
    await expect(firstPage.getByText("Details saved", { exact: true })).toBeVisible();

    await stalePage.getByLabel("Contact name").fill("Stale editor");
    await stalePage.getByRole("button", { name: "Save details" }).click();
    await expect(
      stalePage.getByText("This Draft changed. Reload it before saving again"),
    ).toBeVisible();

    await firstPage.getByRole("button", { name: "Delete Draft" }).click();
    await firstPage.getByLabel("Reason").fill("Created while testing the schedule");
    await firstPage.getByRole("button", { name: "Delete Draft", exact: true }).last().click();
    await expect(firstPage.getByText("Draft deleted")).toBeVisible();
    await expect(firstPage.getByRole("heading", { name: "Competitions" })).toBeVisible();

    const audit = await firstPage.request.get(
      `${E2E_URLS.api}/api/manager/organizations/${draftOrganizationId}/competitions/${competitionId}/audit`,
    );
    expect(audit.ok()).toBeTruthy();
    const auditBody = (await audit.json()) as {
      entries: Array<{ action: string; reason: string | null }>;
    };
    expect(auditBody.entries).toContainEqual(
      expect.objectContaining({ action: "DELETE", reason: "Created while testing the schedule" }),
    );
    await context.close();
  });

  test("the sidebar switches between Organizations", async ({ browser }) => {
    const context = await browser.newContext({ storageState: E2E_AUTH_FILES.staff });
    const page = await context.newPage();
    await page.goto(E2E_URLS.manager);

    await expect(page.getByText("Competition Manager", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Operations desk", { exact: true })).toHaveCount(0);

    const accountTrigger = page.getByRole("button", {
      name: `Account: ${E2E_USERS.staff.name}`,
    });
    await expect(accountTrigger).toBeVisible();
    const accountName = accountTrigger.getByText(E2E_USERS.staff.name);
    await expect(accountName).toHaveCSS("text-overflow", "ellipsis");
    expect(await accountName.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
      true,
    );

    const primaryOrganization = "E2E Athletics Organization";
    const secondaryOrganization = "E2E Secondary Organization";
    const primaryTrigger = page.getByRole("button", {
      name: `Organization: ${primaryOrganization}`,
    });
    const startsOnPrimary = await primaryTrigger.isVisible();
    const activeOrganization = startsOnPrimary ? primaryOrganization : secondaryOrganization;
    const targetOrganization = startsOnPrimary ? secondaryOrganization : primaryOrganization;

    await page.getByRole("button", { name: `Organization: ${activeOrganization}` }).click();
    await page.getByRole("menuitem", { name: new RegExp(targetOrganization) }).click();
    await expect(page).toHaveURL(/\/organizations\/[A-Za-z0-9]{32}\/competitions$/);
    await expect(page.locator("header").getByText(targetOrganization)).toBeVisible();
    await expect(
      page.getByRole("button", { name: `Organization: ${targetOrganization}` }),
    ).toBeVisible();
    await context.close();
  });

  test("ordinary members and cross-tenant Users cannot manage Competitions", async ({
    browser,
  }) => {
    const memberContext = await browser.newContext({ storageState: E2E_AUTH_FILES.member });
    const memberPage = await memberContext.newPage();
    await memberPage.goto(E2E_URLS.manager);
    await expect(memberPage.getByText("Competition permission required")).toBeVisible();
    await memberContext.close();

    const outsiderContext = await browser.newContext({ storageState: E2E_AUTH_FILES.secondOwner });
    const outsiderPage = await outsiderContext.newPage();
    await outsiderPage.goto(
      `${E2E_URLS.manager}/organizations/${primaryOrganizationId}/competitions`,
    );
    await expect(outsiderPage.getByText("Organization not found")).toBeVisible();
    await outsiderContext.close();
  });
});

test.describe("manager verification", () => {
  test.use({ storageState: E2E_AUTH_FILES.unverifiedUser });

  test("denies an unverified Organization Owner", async ({ page }) => {
    await page.goto(E2E_URLS.manager);
    await expect(page).toHaveURL(`${E2E_URLS.manager}/unauthorized`);
    await expect(page.getByRole("heading", { name: "Manager access unavailable" })).toBeVisible();
  });
});

async function createDraft(page: Page, name: string) {
  await page
    .getByRole("link", { name: /New Competition|Create the first Competition/ })
    .first()
    .click();
  await page.getByLabel("Competition name").fill(name);
  await page.getByLabel("Athletics Season").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Create Draft" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

async function addEvent(
  page: Page,
  input: {
    discipline: string;
    name: string;
    category: string;
    roundStart: string;
    prices: string[];
    relay?: boolean;
    startGroup?: boolean;
  },
) {
  await page.getByRole("button", { name: "Add Event" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Discipline").selectOption({ label: input.discipline });
  if (input.relay) {
    await dialog.getByLabel("Event kind").selectOption("RELAY");
    await expect(dialog.getByLabel("Relay legs")).toHaveValue("4");
  }
  await dialog.getByLabel(/Name ·/).fill(input.name);
  await dialog.getByText(input.category, { exact: true }).click();
  const priceInputs = dialog.getByLabel(/price \(€\)/);
  await expect(priceInputs).toHaveCount(input.prices.length);
  for (const [index, price] of input.prices.entries()) {
    await priceInputs.nth(index).fill(price);
  }
  await dialog.getByLabel("Scheduled start").fill(input.roundStart);
  if (input.startGroup) {
    await dialog.getByRole("button", { name: "Add group" }).click();
    await dialog.getByLabel("Start Group label").fill("Heat 1");
  }
  await dialog.getByRole("button", { name: "Add Event", exact: true }).last().click();
  await expect(page.getByText(input.name, { exact: true })).toBeVisible();
}

function organizationIdFrom(url: string) {
  const match = url.match(/\/organizations\/([^/]+)\/competitions/);
  if (!match) throw new Error(`Could not read Organization ID from ${url}`);
  return match[1];
}
