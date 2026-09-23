import { describe, expect, it } from "vitest";

import { getAgeBand, getAthleteCategoryCode } from "./athlete-category";

describe("Belgian Athletics age bands", () => {
  it("starts KAN at season age six and has no younger band", () => {
    expect(getAgeBand("2021-01-01", "2025-11-01")).toBeNull();
    expect(getAgeBand("2020-12-31", "2025-11-01")).toBe("KAN");
  });

  it("changes non-Masters bands at the November season boundary", () => {
    expect(getAgeBand("2018-08-20", "2025-10-31")).toBe("KAN");
    expect(getAgeBand("2018-08-20", "2025-11-01")).toBe("BEN");
  });

  it("keeps a 22-year-old in U23 instead of Senior", () => {
    expect(getAgeBand("2004-06-15", "2026-09-23")).toBe("ESP");
    expect(getAthleteCategoryCode("2004-06-15", "2026-09-23", "F")).toBe("ESP-F");
    expect(getAgeBand("2003-06-15", "2026-09-23")).toBe("SEN");
  });

  it("moves Masters bands on birthdays and resolves men's and women's codes", () => {
    expect(getAgeBand("1991-09-24", "2026-09-23")).toBe("SEN");
    expect(getAthleteCategoryCode("1991-09-24", "2026-09-24", "M")).toBe("M35");
    expect(getAthleteCategoryCode("1991-09-24", "2031-09-24", "F")).toBe("W40");
  });
});
