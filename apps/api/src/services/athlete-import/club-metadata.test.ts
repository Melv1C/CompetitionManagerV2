import { describe, expect, it } from "vitest";

import { deriveLrbaClubs } from "./club-metadata";
import type { LrbaAthleteRow } from "./types";

function row(overrides: Partial<LrbaAthleteRow> = {}): LrbaAthleteRow {
  return {
    sourceRow: 2,
    license: "306195854453",
    bib: 124,
    firstName: "Jean",
    lastName: "Bergeret",
    gender: "M",
    birthDate: "2001-03-12",
    clubExternalId: "42",
    clubAbbreviation: "RESC",
    ...overrides,
  };
}

describe("LRBA club metadata", () => {
  it("derives Belgian club data from the export without an external lookup", () => {
    expect(deriveLrbaClubs([row()])).toEqual([
      {
        externalId: "42",
        name: "RESC",
        abbreviation: "RESC",
        countryCode: "BE",
        active: true,
      },
    ]);
  });

  it("uses the established mapping for foreign affiliations", () => {
    expect(deriveLrbaClubs([row({ clubExternalId: "99", clubAbbreviation: "FRA" })])).toEqual([
      {
        externalId: "99",
        name: "France",
        abbreviation: "FRA",
        countryCode: "FR",
        active: true,
      },
    ]);
  });

  it("rejects conflicting abbreviations for one federation number", () => {
    expect(() => deriveLrbaClubs([row(), row({ sourceRow: 3, clubAbbreviation: "CABW" })])).toThrow(
      "Club federation number 42 has multiple abbreviations",
    );
  });
});
