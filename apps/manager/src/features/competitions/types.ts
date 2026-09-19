import type {
  AppLocale,
  CreateCompetition,
  UpdateCompetitionDetails,
  UpdateCompetitionPricing,
  UpsertCompetitionEvent,
} from "@repo/utils";

export type {
  CreateCompetition,
  UpdateCompetitionDetails,
  UpdateCompetitionPricing,
  UpsertCompetitionEvent,
};

export type CatalogTranslation = { locale: AppLocale; name: string; abbreviation?: string | null };

export type CompetitionCatalog = {
  seasons: Array<{ id: string; provider: string; code: string; startsOn: string; endsOn: string }>;
  disciplines: Array<{
    id: string;
    code: string;
    measurement: string;
    translations: CatalogTranslation[];
  }>;
  categories: Array<{
    id: string;
    code: string;
    gender: string;
    translations: CatalogTranslation[];
  }>;
  clubs: Array<{ id: string; name: string; abbreviation: string | null }>;
};

export type Competition = {
  id: string;
  organizationId: string;
  athleticsSeasonId: string;
  primaryLocale: AppLocale;
  lifecycleState: "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
  registrationState: "SCHEDULED" | "OPEN" | "CLOSED";
  startsAt: string | null;
  endsAt: string | null;
  timeZone: string | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  maxEventEntriesPerAthlete: number | null;
  oneDayRegistrationEnabled: boolean;
  oneDayBibStart: number | null;
  oneDayBibEnd: number | null;
  capacityReservationMinutes: number;
  settlementDelayDays: number;
  updatedAt: string;
  publishedAt: string | null;
  athleticsSeason: CompetitionCatalog["seasons"][number];
  translations: Array<{
    id: string;
    locale: AppLocale;
    name: string;
    description: string;
  }>;
  venue: null | {
    name: string;
    addressLine1: string;
    addressLine2: string | null;
    postalCode: string;
    city: string;
    region: string | null;
    countryCode: string;
    latitude: number | null;
    longitude: number | null;
  };
  clubEligibility: Array<{ clubId: string; club: CompetitionCatalog["clubs"][number] }>;
  pricingTiers: Array<{
    id: string;
    name: string;
    isDefault: boolean;
    clubAssignments: Array<{ clubId: string; club: CompetitionCatalog["clubs"][number] }>;
  }>;
  events: CompetitionEvent[];
  readiness: { ready: boolean; missing: string[] };
};

export type CompetitionEvent = {
  id: string;
  disciplineId: string;
  kind: "INDIVIDUAL" | "RELAY";
  resultEntryMode: "ATHLETICS_MANAGER" | "COMPETITION_MANAGER_WEB";
  registerable: boolean;
  capacity: number | null;
  relayLegCount: number | null;
  active: boolean;
  discipline: CompetitionCatalog["disciplines"][number];
  translations: Competition["translations"];
  eligibility: Array<{ athleteCategoryId: string }>;
  prices: Array<{ pricingTierId: string; priceCents: number }>;
  rounds: Array<{
    id: string;
    label: string;
    sequence: number;
    scheduledStartAt: string | null;
    startGroups: Array<{
      id: string;
      label: string;
      sequence: number;
      scheduledStartAt: string | null;
    }>;
  }>;
};

export type CompetitionSummary = {
  id: string;
  name: string;
  lifecycleState: Competition["lifecycleState"];
  registrationState: Competition["registrationState"];
  startsAt: string | null;
  endsAt: string | null;
  updatedAt: string;
  eventCount: number;
};
