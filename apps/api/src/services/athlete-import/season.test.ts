import { describe, expect, it } from "vitest";

import { getDefaultLrbaSeason } from "./season";

describe("default LRBA athletics season", () => {
  it("uses the current ending year through October", () => {
    expect(getDefaultLrbaSeason(new Date("2026-09-21T00:00:00.000Z"))).toEqual({
      code: "2026",
      startsOn: "2025-11-01",
      endsOn: "2026-10-31",
      label: "LRBA 2025/2026",
    });
  });

  it("moves to the next ending year on November 1", () => {
    expect(getDefaultLrbaSeason(new Date("2026-11-01T00:00:00.000Z"))).toEqual({
      code: "2027",
      startsOn: "2026-11-01",
      endsOn: "2027-10-31",
      label: "LRBA 2026/2027",
    });
  });
});
