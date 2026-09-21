import type { AthleteImportValidationError, LrbaAthleteRow } from "./types";

const requiredHeaders = [
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
] as const;

const MAX_ERRORS = 100;

export type LrbaParseResult =
  | { success: true; rows: LrbaAthleteRow[] }
  | { success: false; errors: AthleteImportValidationError[] };

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseLrbaAthleteExport(contents: string, today = new Date()): LrbaParseResult {
  const normalized = contents.replace(/^\uFEFF/, "");
  const lines = normalized.split(/\r?\n/);
  while (lines.at(-1)?.trim() === "") lines.pop();

  if (lines.length < 2) {
    return {
      success: false,
      errors: [{ row: null, field: null, message: "The LRBA export has no athlete rows" }],
    };
  }

  const headers = lines[0]!.split("\t").map((header) => header.trim());
  const headerIndexes = new Map(headers.map((header, index) => [header, index]));
  const missingHeaders = requiredHeaders.filter((header) => !headerIndexes.has(header));
  if (missingHeaders.length > 0) {
    return {
      success: false,
      errors: missingHeaders.map((header) => ({
        row: 1,
        field: header,
        message: `Missing required LRBA header: ${header}`,
      })),
    };
  }

  const valueAt = (columns: string[], header: (typeof requiredHeaders)[number]) =>
    columns[headerIndexes.get(header)!]?.trim() ?? "";
  const rows: LrbaAthleteRow[] = [];
  const errors: AthleteImportValidationError[] = [];
  const licenses = new Set<string>();
  const todayIso = today.toISOString().slice(0, 10);

  const report = (error: AthleteImportValidationError) => {
    if (errors.length < MAX_ERRORS) errors.push(error);
  };

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (line.trim() === "") continue;

    const sourceRow = index + 1;
    const columns = line.split("\t");
    const license = valueAt(columns, "db_licenses.licensenumber*");
    const bibValue = valueAt(columns, "db_licenses.bib");
    const firstName = valueAt(columns, "db_athletes.firstname");
    const lastName = valueAt(columns, "db_athletes.lastname");
    const gender = valueAt(columns, "db_athletes.gender");
    const birthDate = valueAt(columns, "db_athletes.birthdate");
    const clubExternalId = valueAt(columns, "db_teams.federationnumber");
    const clubAbbreviation = valueAt(columns, "db_teams.abbreviation");
    let valid = true;

    if (!/^\d+$/.test(license) || BigInt(license || "0") <= 10_000n) {
      report({ row: sourceRow, field: "license", message: "License must be greater than 10000" });
      valid = false;
    } else if (licenses.has(license)) {
      report({ row: sourceRow, field: "license", message: `Duplicate license ${license}` });
      valid = false;
    }

    const bib = Number(bibValue);
    if (!/^\d+$/.test(bibValue) || !Number.isSafeInteger(bib) || bib <= 0) {
      report({ row: sourceRow, field: "bib", message: "Bib must be a positive integer" });
      valid = false;
    }

    if (firstName.length < 1 || firstName.length > 50) {
      report({
        row: sourceRow,
        field: "firstName",
        message: "First name must contain 1 to 50 characters",
      });
      valid = false;
    }
    if (lastName.length < 1 || lastName.length > 50) {
      report({
        row: sourceRow,
        field: "lastName",
        message: "Last name must contain 1 to 50 characters",
      });
      valid = false;
    }
    if (gender !== "M" && gender !== "F") {
      report({ row: sourceRow, field: "gender", message: "Gender must be M or F" });
      valid = false;
    }
    if (!isIsoDate(birthDate) || birthDate < "1900-01-01" || birthDate > todayIso) {
      report({
        row: sourceRow,
        field: "birthDate",
        message: "Birth date must be a valid YYYY-MM-DD date between 1900-01-01 and today",
      });
      valid = false;
    }
    if (!/^\d+$/.test(clubExternalId)) {
      report({
        row: sourceRow,
        field: "clubExternalId",
        message: "Club federation number must contain only digits",
      });
      valid = false;
    }
    if (clubAbbreviation.length < 1 || clubAbbreviation.length > 30) {
      report({
        row: sourceRow,
        field: "clubAbbreviation",
        message: "Club abbreviation must contain 1 to 30 characters",
      });
      valid = false;
    }

    if (!valid) continue;
    licenses.add(license);
    rows.push({
      sourceRow,
      license,
      bib,
      firstName,
      lastName,
      gender: gender as "M" | "F",
      birthDate,
      clubExternalId,
      clubAbbreviation,
    });
  }

  return errors.length > 0 ? { success: false, errors } : { success: true, rows };
}
