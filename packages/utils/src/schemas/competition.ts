import * as z from "zod";

import { Date$ } from "./base";

export const AppLocale$ = z.enum(["EN", "FR", "NL"]);
export type AppLocale = z.infer<typeof AppLocale$>;

export const CompetitionEventKind$ = z.enum(["INDIVIDUAL", "RELAY"]);
export const ResultEntryMode$ = z.enum(["ATHLETICS_MANAGER", "COMPETITION_MANAGER_WEB"]);

const Uuid$ = z.uuid();
const OptionalDate$ = Date$.nullable();
const MoneyCents$ = z.int().min(0);

export const TranslationInput$ = z.object({
  locale: AppLocale$,
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(10_000).default(""),
});

export const CreateCompetition$ = z.object({
  athleticsSeasonId: Uuid$,
  primaryLocale: AppLocale$,
  name: z.string().trim().min(1).max(160),
});
export type CreateCompetition = z.infer<typeof CreateCompetition$>;

export const CompetitionMutationVersion$ = z.object({
  expectedUpdatedAt: Date$,
});

export const UpdateCompetitionDetails$ = CompetitionMutationVersion$.extend({
  translations: z.array(TranslationInput$).min(1).max(3),
  startsAt: OptionalDate$,
  endsAt: OptionalDate$,
  timeZone: z
    .string()
    .trim()
    .max(80)
    .nullable()
    .refine((timeZone) => {
      if (!timeZone) return true;
      try {
        new Intl.DateTimeFormat("en", { timeZone }).format();
        return true;
      } catch {
        return false;
      }
    }, "Use a valid IANA time zone."),
  registrationOpensAt: OptionalDate$,
  registrationClosesAt: OptionalDate$,
  contactName: z.string().trim().max(160).nullable(),
  contactEmail: z.union([z.email(), z.literal("")]).nullable(),
  contactPhone: z.string().trim().max(40).nullable(),
  maxEventEntriesPerAthlete: z.int().positive().nullable(),
  oneDayRegistrationEnabled: z.boolean(),
  oneDayBibStart: z.int().positive().nullable(),
  oneDayBibEnd: z.int().positive().nullable(),
  capacityReservationMinutes: z.int().positive().max(1_440),
  settlementDelayDays: z.int().min(0).max(365),
  venue: z
    .object({
      name: z.string().trim().max(160),
      addressLine1: z.string().trim().max(200),
      addressLine2: z.string().trim().max(200).nullable(),
      postalCode: z.string().trim().max(24),
      city: z.string().trim().max(120),
      region: z.string().trim().max(120).nullable(),
      countryCode: z.string().trim().toUpperCase().length(2),
      latitude: z.number().min(-90).max(90).nullable(),
      longitude: z.number().min(-180).max(180).nullable(),
    })
    .nullable(),
  clubEligibilityIds: z.array(Uuid$),
}).superRefine((value, context) => {
  if (value.startsAt && value.endsAt && value.endsAt <= value.startsAt) {
    context.addIssue({ code: "custom", path: ["endsAt"], message: "End must follow start." });
  }
  if (
    value.registrationOpensAt &&
    value.registrationClosesAt &&
    value.registrationClosesAt <= value.registrationOpensAt
  ) {
    context.addIssue({
      code: "custom",
      path: ["registrationClosesAt"],
      message: "Registration closing must follow opening.",
    });
  }
  if (value.registrationClosesAt && value.startsAt && value.registrationClosesAt > value.startsAt) {
    context.addIssue({
      code: "custom",
      path: ["registrationClosesAt"],
      message: "Registration must close before the Competition starts.",
    });
  }
  if (value.oneDayRegistrationEnabled) {
    if (!value.oneDayBibStart || !value.oneDayBibEnd) {
      context.addIssue({
        code: "custom",
        path: ["oneDayBibStart"],
        message: "A complete bib range is required for one-day registration.",
      });
    } else if (value.oneDayBibEnd < value.oneDayBibStart) {
      context.addIssue({
        code: "custom",
        path: ["oneDayBibEnd"],
        message: "The last bib must not be lower than the first bib.",
      });
    }
  } else if (value.oneDayBibStart || value.oneDayBibEnd) {
    context.addIssue({
      code: "custom",
      path: ["oneDayBibStart"],
      message: "Enable one-day registration before assigning a bib range.",
    });
  }
});
export type UpdateCompetitionDetails = z.infer<typeof UpdateCompetitionDetails$>;

export const UpdateCompetitionPricing$ = CompetitionMutationVersion$.extend({
  tiers: z
    .array(
      z.object({
        id: Uuid$.optional(),
        name: z.string().trim().min(1).max(100),
        isDefault: z.boolean(),
        clubIds: z.array(Uuid$),
      }),
    )
    .min(1),
}).superRefine((value, context) => {
  if (value.tiers.filter((tier) => tier.isDefault).length !== 1) {
    context.addIssue({ code: "custom", path: ["tiers"], message: "Choose one default tier." });
  }
  const clubIds = value.tiers.flatMap((tier) => tier.clubIds);
  if (new Set(clubIds).size !== clubIds.length) {
    context.addIssue({
      code: "custom",
      path: ["tiers"],
      message: "A Club can belong to only one Pricing Tier.",
    });
  }
});
export type UpdateCompetitionPricing = z.infer<typeof UpdateCompetitionPricing$>;

const StartGroupInput$ = z.object({
  id: Uuid$.optional(),
  label: z.string().trim().min(1).max(100),
  scheduledStartAt: OptionalDate$,
});

const RoundInput$ = z.object({
  id: Uuid$.optional(),
  label: z.string().trim().min(1).max(100),
  scheduledStartAt: OptionalDate$,
  startGroups: z.array(StartGroupInput$),
});

export const UpsertCompetitionEvent$ = CompetitionMutationVersion$.extend({
  disciplineId: Uuid$,
  kind: CompetitionEventKind$,
  relayLegCount: z.int().positive().max(20).nullable(),
  resultEntryMode: ResultEntryMode$,
  registerable: z.boolean(),
  capacity: z.int().positive().nullable(),
  translations: z.array(TranslationInput$).min(1).max(3),
  athleteCategoryIds: z.array(Uuid$),
  prices: z.array(
    z.object({
      pricingTierId: Uuid$,
      priceCents: MoneyCents$,
    }),
  ),
  rounds: z.array(RoundInput$),
}).superRefine((value, context) => {
  if (value.kind === "RELAY" && !value.relayLegCount) {
    context.addIssue({
      code: "custom",
      path: ["relayLegCount"],
      message: "Relay Events require a leg count.",
    });
  }
  if (value.kind !== "RELAY" && value.relayLegCount !== null) {
    context.addIssue({
      code: "custom",
      path: ["relayLegCount"],
      message: "Only Relay Events have a leg count.",
    });
  }
});
export type UpsertCompetitionEvent = z.infer<typeof UpsertCompetitionEvent$>;

export const DeleteDraftCompetition$ = z.object({
  expectedUpdatedAt: Date$,
  reason: z.string().trim().min(1).max(500),
});

export const PublishCompetition$ = CompetitionMutationVersion$;

export const CompetitionIdParams$ = z.object({
  organizationId: z.string().trim().min(1),
  competitionId: Uuid$,
});

export const OrganizationIdParams$ = z.object({
  organizationId: z.string().trim().min(1),
});
