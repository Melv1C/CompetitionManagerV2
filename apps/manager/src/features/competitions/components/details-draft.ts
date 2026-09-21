import type { AppLocale, UpdateCompetitionDetails } from "@repo/utils";

import type { Competition } from "@/features/competitions";
import { instantToZonedInput, requireValidZonedDate } from "@/features/competitions/date-time";

export const competitionLocales = ["EN", "FR", "NL"] as const;

export const localeLabels: Record<AppLocale, string> = {
  EN: "English",
  FR: "French",
  NL: "Dutch",
};

export type DetailsDraft = {
  timeZone: string;
  translations: Record<AppLocale, { name: string; description: string }>;
  startsAt: string;
  endsAt: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  maxEntries: string;
  oneDayEnabled: boolean;
  bibStart: string;
  bibEnd: string;
  reservationMinutes: string;
  settlementDays: string;
  venue: {
    name: string;
    addressLine1: string;
    addressLine2: string;
    postalCode: string;
    city: string;
    region: string;
    countryCode: string;
    latitude: string;
    longitude: string;
  };
  clubEligibilityIds: string[];
};

export function createDetailsDraft(competition: Competition): DetailsDraft {
  const timeZone = competition.timeZone ?? "Europe/Brussels";
  return {
    timeZone,
    translations: Object.fromEntries(
      competitionLocales.map((locale) => {
        const translation = competition.translations.find((item) => item.locale === locale);
        return [
          locale,
          { name: translation?.name ?? "", description: translation?.description ?? "" },
        ];
      }),
    ) as DetailsDraft["translations"],
    startsAt: instantToZonedInput(competition.startsAt, timeZone),
    endsAt: instantToZonedInput(competition.endsAt, timeZone),
    registrationOpensAt: instantToZonedInput(competition.registrationOpensAt, timeZone),
    registrationClosesAt: instantToZonedInput(competition.registrationClosesAt, timeZone),
    contactName: competition.contactName ?? "",
    contactEmail: competition.contactEmail ?? "",
    contactPhone: competition.contactPhone ?? "",
    maxEntries: competition.maxEventEntriesPerAthlete?.toString() ?? "",
    oneDayEnabled: competition.oneDayRegistrationEnabled,
    bibStart: competition.oneDayBibStart?.toString() ?? "",
    bibEnd: competition.oneDayBibEnd?.toString() ?? "",
    reservationMinutes: competition.capacityReservationMinutes.toString(),
    settlementDays: competition.settlementDelayDays.toString(),
    venue: {
      name: competition.venue?.name ?? "",
      addressLine1: competition.venue?.addressLine1 ?? "",
      addressLine2: competition.venue?.addressLine2 ?? "",
      postalCode: competition.venue?.postalCode ?? "",
      city: competition.venue?.city ?? "",
      region: competition.venue?.region ?? "",
      countryCode: competition.venue?.countryCode ?? "BE",
      latitude: competition.venue?.latitude?.toString() ?? "",
      longitude: competition.venue?.longitude?.toString() ?? "",
    },
    clubEligibilityIds: competition.clubEligibility.map((entry) => entry.clubId),
  };
}

export function buildDetailsInput(
  competition: Competition,
  draft: DetailsDraft,
): UpdateCompetitionDetails {
  const hasVenue = Object.values(draft.venue).some((value) => value.trim());
  return {
    expectedUpdatedAt: new Date(competition.updatedAt),
    translations: competitionLocales
      .filter((locale) => draft.translations[locale].name.trim())
      .map((locale) => ({ locale, ...draft.translations[locale] })),
    startsAt: zonedDate(draft.startsAt, draft.timeZone, "Competition start"),
    endsAt: zonedDate(draft.endsAt, draft.timeZone, "Competition end"),
    timeZone: draft.timeZone.trim() || null,
    registrationOpensAt: zonedDate(
      draft.registrationOpensAt,
      draft.timeZone,
      "Registration opening",
    ),
    registrationClosesAt: zonedDate(
      draft.registrationClosesAt,
      draft.timeZone,
      "Registration closing",
    ),
    contactName: draft.contactName.trim() || null,
    contactEmail: draft.contactEmail.trim() || null,
    contactPhone: draft.contactPhone.trim() || null,
    maxEventEntriesPerAthlete: positiveNumber(draft.maxEntries),
    oneDayRegistrationEnabled: draft.oneDayEnabled,
    oneDayBibStart: draft.oneDayEnabled ? positiveNumber(draft.bibStart) : null,
    oneDayBibEnd: draft.oneDayEnabled ? positiveNumber(draft.bibEnd) : null,
    capacityReservationMinutes: positiveNumber(draft.reservationMinutes) ?? 15,
    settlementDelayDays: nonNegativeNumber(draft.settlementDays) ?? 0,
    venue: hasVenue
      ? {
          ...draft.venue,
          addressLine2: draft.venue.addressLine2.trim() || null,
          region: draft.venue.region.trim() || null,
          latitude: decimalNumber(draft.venue.latitude),
          longitude: decimalNumber(draft.venue.longitude),
        }
      : null,
    clubEligibilityIds: draft.clubEligibilityIds,
  };
}

function zonedDate(value: string, timeZone: string, label: string) {
  return value ? requireValidZonedDate(value, timeZone, label) : null;
}

function positiveNumber(value: string) {
  const number = Number(value);
  return value && Number.isInteger(number) && number > 0 ? number : null;
}

function nonNegativeNumber(value: string) {
  const number = Number(value);
  return value && Number.isInteger(number) && number >= 0 ? number : null;
}

function decimalNumber(value: string) {
  const number = Number(value);
  return value && Number.isFinite(number) ? number : null;
}
