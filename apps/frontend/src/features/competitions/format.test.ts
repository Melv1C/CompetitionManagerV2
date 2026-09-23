import { describe, expect, it } from "vitest";

import { formatEuros, selectTranslation } from "./format";

const translations = [
  { locale: "EN" as const, name: "Brussels Open" },
  { locale: "FR" as const, name: "Open de Bruxelles" },
];

describe("public Competition formatting", () => {
  it("uses the interface locale before the primary locale", () => {
    expect(selectTranslation(translations, "fr-BE", "EN")?.name).toBe("Open de Bruxelles");
    expect(selectTranslation(translations, "nl-BE", "EN")?.name).toBe("Brussels Open");
  });

  it("uses the first translation as a defensive final fallback", () => {
    expect(selectTranslation(translations.slice(1), "nl-BE", "EN")?.name).toBe("Open de Bruxelles");
  });

  it("formats integer cents as EUR", () => {
    expect(formatEuros(600, "en-BE")).toMatch(/€6\.00|6\.00\s€/);
  });
});
