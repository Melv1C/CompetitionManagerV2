import type { PublicTranslation } from "./types";

type AppLocale = PublicTranslation["locale"];

export function appLocale(language: string): AppLocale {
  const code = language.slice(0, 2).toUpperCase();
  return code === "FR" || code === "NL" ? code : "EN";
}

export function browserLocale(language: string) {
  const code = language.slice(0, 2).toLowerCase();
  if (code === "fr") return "fr-BE";
  if (code === "nl") return "nl-BE";
  return "en-BE";
}

export function selectTranslation<T extends PublicTranslation>(
  translations: T[],
  language: string,
  primaryLocale: AppLocale,
) {
  return (
    translations.find(({ locale }) => locale === appLocale(language)) ??
    translations.find(({ locale }) => locale === primaryLocale) ??
    translations[0]
  );
}

export function formatCompetitionDate(
  value: string,
  language: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
) {
  return new Intl.DateTimeFormat(browserLocale(language), { timeZone, ...options }).format(
    new Date(value),
  );
}

export function formatCompetitionDateRange(
  start: string,
  end: string,
  language: string,
  timeZone: string,
) {
  return new Intl.DateTimeFormat(browserLocale(language), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).formatRange(new Date(start), new Date(end));
}

export function formatEuros(cents: number, language: string) {
  return new Intl.NumberFormat(browserLocale(language), {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
