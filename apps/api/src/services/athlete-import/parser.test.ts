import { describe, expect, it } from "vitest";

import { parseLrbaAthleteExport } from "./parser";

const header = [
  "db_licenses.licensenumber*",
  "db_licenses.bib",
  "db_licenses.id_for_federation",
  "db_athletes.firstname",
  "db_athletes.lastname",
  "db_athletes.gender",
  "db_athletes.birthdate",
  "db_countries.iso3",
  "db_teams.federationnumber",
  "db_teams.abbreviation",
].join("\t");

describe("LRBA athlete export parser", () => {
  it("parses the established tab-separated export by header name", () => {
    const result = parseLrbaAthleteExport(
      `${header}\r\n306195854453\t124\t1512\tJean\tBergeret\tM\t2001-03-12\tBEL\t42\tRESC\r\n`,
      new Date("2026-09-21T00:00:00.000Z"),
    );

    expect(result).toEqual({
      success: true,
      rows: [
        {
          sourceRow: 2,
          license: "306195854453",
          bib: 124,
          firstName: "Jean",
          lastName: "Bergeret",
          gender: "M",
          birthDate: "2001-03-12",
          clubExternalId: "42",
          clubAbbreviation: "RESC",
        },
      ],
    });
  });

  it("rejects duplicate licenses and malformed athlete data atomically", () => {
    const row = "306195854453\t0\t1512\t\tBergeret\tX\t2030-01-01\tBEL\t42\tRESC";
    const result = parseLrbaAthleteExport(
      `${header}\n${row}\n${row}`,
      new Date("2026-09-21T00:00:00.000Z"),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(["bib", "firstName", "gender", "birthDate"]),
    );
  });

  it("rejects files that do not use the LRBA headers", () => {
    const result = parseLrbaAthleteExport("license,name\n12345,Athlete");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors[0]?.message).toContain("Missing required LRBA header");
  });
});
