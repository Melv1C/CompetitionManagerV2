/** Belgian Athletics age band at a reference date. The season runs November 1–October 31. */
export function getAgeBand(birthDate: Date | string, referenceDate: Date | string): string | null {
  const birth = dateParts(birthDate);
  const reference = dateParts(referenceDate);
  if (compareDates(birth, reference) > 0) return null;

  const actualAge =
    reference.year -
    birth.year -
    (reference.month < birth.month || (reference.month === birth.month && reference.day < birth.day)
      ? 1
      : 0);
  if (actualAge >= 35) return `M${35 + Math.floor((actualAge - 35) / 5) * 5}`;

  const seasonEndingYear = reference.year + (reference.month >= 11 ? 1 : 0);
  const seasonAge = seasonEndingYear - birth.year;
  if (seasonAge < 6) return null;
  if (seasonAge <= 7) return "KAN";
  if (seasonAge <= 9) return "BEN";
  if (seasonAge <= 11) return "PUP";
  if (seasonAge <= 13) return "MIN";
  if (seasonAge <= 15) return "CAD";
  if (seasonAge <= 17) return "SCO";
  if (seasonAge <= 19) return "JUN";
  if (seasonAge <= 22) return "ESP";
  return "SEN";
}

/** Resolve a base age band to the code of a standard gender-specific category. */
export function getAthleteCategoryCode(
  birthDate: Date | string,
  referenceDate: Date | string,
  gender: "M" | "F",
): string | null {
  const band = getAgeBand(birthDate, referenceDate);
  if (!band) return null;
  if (band.startsWith("M") && /^M\d+$/.test(band)) {
    return `${gender === "F" ? "W" : "M"}${band.slice(1)}`;
  }
  return `${band}-${gender}`;
}

function dateParts(value: Date | string) {
  const date = typeof value === "string" ? new Date(`${value.slice(0, 10)}T00:00:00Z`) : value;
  if (Number.isNaN(date.getTime())) throw new RangeError("Invalid date");
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function compareDates(a: ReturnType<typeof dateParts>, b: ReturnType<typeof dateParts>) {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}
