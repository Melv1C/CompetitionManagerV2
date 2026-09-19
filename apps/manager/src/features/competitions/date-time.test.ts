import { describe, expect, it } from "vitest";

import { instantToZonedInput, zonedInputToInstant } from "./date-time";

describe("Competition date-time conversion", () => {
  it("converts a valid local time to an instant and back", () => {
    const instant = zonedInputToInstant("2027-06-12T09:00", "Europe/Brussels");

    expect(instant).toBe("2027-06-12T07:00:00.000Z");
    expect(instantToZonedInput(instant, "Europe/Brussels")).toBe("2027-06-12T09:00");
  });

  it("rejects a local time inside a daylight-saving gap", () => {
    expect(zonedInputToInstant("2027-03-28T02:30", "Europe/Brussels")).toBeNull();
  });

  it("rejects normalized calendar dates", () => {
    expect(zonedInputToInstant("2027-02-30T09:00", "Europe/Brussels")).toBeNull();
  });
});
