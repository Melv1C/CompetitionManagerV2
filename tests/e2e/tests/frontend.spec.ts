import { expect, test, type Page } from "@playwright/test";

import { E2E_URLS } from "./constants";

async function expectMobilePageToFit(page: Page) {
  const audit = await page.evaluate(() => {
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden";
    };

    const clippedControls = Array.from(
      document.querySelectorAll("a, button, input, [role=tab], [data-slot=select-trigger]"),
    )
      .filter(visible)
      .filter((element) => !element.closest("[data-slot=table-container]"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          label: element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 60),
          left: rect.left,
          right: rect.right,
        };
      })
      .filter(({ left, right }) => left < -1 || right > window.innerWidth + 1);

    const undersizedControls = Array.from(
      document.querySelectorAll(
        '[data-slot="button"], [data-slot="select-trigger"], [data-slot="tabs-trigger"], [class~="group/button"]',
      ),
    )
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          label: element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 60),
          height: rect.height,
        };
      })
      .filter(({ height }) => height < 43);

    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clippedControls,
      undersizedControls,
    };
  });

  expect(audit.scrollWidth).toBe(audit.clientWidth);
  expect(audit.clippedControls).toEqual([]);
  expect(audit.undersizedControls).toEqual([]);
}

test("public home supports competition discovery", async ({ page }) => {
  await page.goto(E2E_URLS.frontend);

  await expect(page.getByRole("heading", { name: "Your next start line is here." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Next competitions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Latest results" })).toBeVisible();
});

for (const width of [360, 390, 430]) {
  test.describe(`mobile frontend at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test("keeps core routes inside the viewport", async ({ page }) => {
      const routes = [
        "/",
        "/competitions",
        "/competitions/brussels-open",
        "/competitions/brussels-open/events/women-100m",
        "/results",
        "/registrations",
        "/register",
        "/profile",
      ];

      for (const route of routes) {
        await page.goto(`${E2E_URLS.frontend}${route}`);
        await expectMobilePageToFit(page);
      }
    });

    test("exposes navigation through the mobile menu", async ({ page }) => {
      await page.goto(E2E_URLS.frontend);
      await page.getByRole("button", { name: "Menu", exact: true }).click();

      const menu = page.getByRole("navigation", { name: "Menu" });
      await expect(menu.getByRole("link", { name: "Competitions" })).toBeVisible();
      await expect(menu.getByRole("link", { name: "Results" })).toBeVisible();
      await expect(menu.getByRole("link", { name: "My registrations" })).toBeVisible();

      await menu.getByRole("link", { name: "Competitions" }).click();
      await expect(page).toHaveURL(`${E2E_URLS.frontend}/competitions`);
    });

    test("keeps result overflow inside the table", async ({ page }) => {
      await page.goto(`${E2E_URLS.frontend}/competitions/brussels-open/events/women-100m`);

      const table = page.locator('[data-slot="table-container"]').first();
      const overflow = await table.evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));

      expect(overflow.scrollWidth).toBeGreaterThan(overflow.clientWidth);
      await expect(page.getByText("Swipe sideways to see every column")).toBeVisible();
      await expectMobilePageToFit(page);
    });

    test("fits the French registration review actions", async ({ page }) => {
      await page.goto(`${E2E_URLS.frontend}/register`);
      await page.getByRole("button", { name: "Change language" }).click();
      await page.getByText("Français", { exact: true }).click();

      for (let step = 0; step < 3; step += 1) {
        await page.getByRole("button", { name: "Continuer" }).click();
      }

      await expect(page.getByRole("button", { name: "Valider et payer" })).toBeVisible();
      await expectMobilePageToFit(page);
    });
  });
}
