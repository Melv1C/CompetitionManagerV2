import type { LrbaAthleteRow, LrbaClubMetadata } from "./types";

const foreignClubs: Record<string, { name: string; countryCode: string }> = {
  NA: { name: "Non affilié", countryCode: "BE" },
  FRA: { name: "France", countryCode: "FR" },
  NED: { name: "Pays-Bas", countryCode: "NL" },
  GER: { name: "Allemagne", countryCode: "DE" },
  LUX: { name: "Luxembourg", countryCode: "LU" },
  GBR: { name: "Royaume-Uni", countryCode: "GB" },
  ITA: { name: "Italie", countryCode: "IT" },
  ESP: { name: "Espagne", countryCode: "ES" },
  POR: { name: "Portugal", countryCode: "PT" },
  SUI: { name: "Suisse", countryCode: "CH" },
  DEN: { name: "Danemark", countryCode: "DK" },
  SWE: { name: "Suède", countryCode: "SE" },
  NOR: { name: "Norvège", countryCode: "NO" },
  FIN: { name: "Finlande", countryCode: "FI" },
  AUT: { name: "Autriche", countryCode: "AT" },
  CZE: { name: "République tchèque", countryCode: "CZ" },
  SVK: { name: "Slovaquie", countryCode: "SK" },
  HUN: { name: "Hongrie", countryCode: "HU" },
  POL: { name: "Pologne", countryCode: "PL" },
  LTU: { name: "Lituanie", countryCode: "LT" },
  LAT: { name: "Lettonie", countryCode: "LV" },
  EST: { name: "Estonie", countryCode: "EE" },
  UKR: { name: "Ukraine", countryCode: "UA" },
  MDA: { name: "Moldavie", countryCode: "MD" },
  ROU: { name: "Roumanie", countryCode: "RO" },
  BUL: { name: "Bulgarie", countryCode: "BG" },
  GRE: { name: "Grèce", countryCode: "GR" },
};

export function deriveLrbaClubs(rows: LrbaAthleteRow[]): LrbaClubMetadata[] {
  const unique = new Map<string, string>();
  for (const row of rows) {
    const existing = unique.get(row.clubExternalId);
    if (existing && existing !== row.clubAbbreviation) {
      throw new Error(`Club federation number ${row.clubExternalId} has multiple abbreviations`);
    }
    unique.set(row.clubExternalId, row.clubAbbreviation);
  }

  return [...unique.entries()].map(([externalId, abbreviation]) => {
    const foreignClub = foreignClubs[abbreviation];
    return {
      externalId,
      name: foreignClub?.name ?? abbreviation,
      abbreviation,
      countryCode: foreignClub?.countryCode ?? "BE",
      active: true,
    };
  });
}
