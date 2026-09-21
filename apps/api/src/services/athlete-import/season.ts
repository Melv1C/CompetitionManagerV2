import type { LrbaSeasonDefinition } from "./types";

export function getDefaultLrbaSeason(now = new Date()): LrbaSeasonDefinition {
  const year = now.getUTCFullYear();
  const endingYear = now.getUTCMonth() >= 10 ? year + 1 : year;

  return {
    code: String(endingYear),
    startsOn: `${endingYear - 1}-11-01`,
    endsOn: `${endingYear}-10-31`,
    label: `LRBA ${endingYear - 1}/${endingYear}`,
  };
}

export function getLrbaSeasonLabel(code: string, startsOn: string, endsOn: string) {
  const startYear = startsOn.slice(0, 4);
  const endYear = endsOn.slice(0, 4);
  return code === endYear ? `LRBA ${startYear}/${endYear}` : `LRBA ${code}`;
}

export function dateToIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
