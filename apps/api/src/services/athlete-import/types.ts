export const LRBA_PROVIDER = "LRBA" as const;

export interface LrbaAthleteRow {
  sourceRow: number;
  license: string;
  bib: number;
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  birthDate: string;
  clubExternalId: string;
  clubAbbreviation: string;
}

export interface LrbaClubMetadata {
  externalId: string;
  name: string;
  abbreviation: string;
  countryCode: string;
  active: true;
}

export interface AthleteImportValidationError {
  row: number | null;
  field: string | null;
  message: string;
}

export interface LrbaSeasonDefinition {
  code: string;
  startsOn: string;
  endsOn: string;
  label: string;
}
