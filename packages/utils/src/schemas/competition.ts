import * as z from "zod";

import { AppLocaleSchema } from "../generated/prisma-zod/schemas/enums/AppLocale.schema";
import { CompetitionEventKindSchema } from "../generated/prisma-zod/schemas/enums/CompetitionEventKind.schema";
import { ResultEntryModeSchema } from "../generated/prisma-zod/schemas/enums/ResultEntryMode.schema";
import { CompetitionSchema } from "../generated/prisma-zod/schemas/models/Competition.schema";
import { CompetitionEventSchema } from "../generated/prisma-zod/schemas/models/CompetitionEvent.schema";
import { CompetitionEventPriceSchema } from "../generated/prisma-zod/schemas/models/CompetitionEventPrice.schema";
import { CompetitionPricingTierSchema } from "../generated/prisma-zod/schemas/models/CompetitionPricingTier.schema";
import { CompetitionTranslationSchema } from "../generated/prisma-zod/schemas/models/CompetitionTranslation.schema";
import { CompetitionVenueSchema } from "../generated/prisma-zod/schemas/models/CompetitionVenue.schema";
import { RoundSchema } from "../generated/prisma-zod/schemas/models/Round.schema";
import { StartGroupSchema } from "../generated/prisma-zod/schemas/models/StartGroup.schema";
import { Date$ } from "./base";

export const AppLocale$ = AppLocaleSchema;
export type AppLocale = z.infer<typeof AppLocale$>;

export const CompetitionEventKind$ = CompetitionEventKindSchema.exclude(["COMBINED"]);
export const ResultEntryMode$ = ResultEntryModeSchema;

const Uuid$ = z.uuid();
const OptionalDate$ = Date$.nullable();
const MoneyCents$ = z.int().min(0);

export const TranslationInput$ = CompetitionTranslationSchema.pick({
  locale: true,
  name: true,
  description: true,
}).extend({
  name: CompetitionTranslationSchema.shape.name.trim().min(1).max(160),
  description: CompetitionTranslationSchema.shape.description.trim().max(10_000).default(""),
});

export const CreateCompetition$ = CompetitionSchema.pick({
  athleticsSeasonId: true,
  primaryLocale: true,
}).extend({
  athleticsSeasonId: Uuid$,
  primaryLocale: AppLocale$,
  name: CompetitionTranslationSchema.shape.name.trim().min(1).max(160),
});
export type CreateCompetition = z.infer<typeof CreateCompetition$>;

export const CompetitionMutationVersion$ = z.object({
  expectedUpdatedAt: Date$,
});

const CompetitionDetails$ = CompetitionSchema.pick({
  startsAt: true,
  endsAt: true,
  timeZone: true,
  registrationOpensAt: true,
  registrationClosesAt: true,
  contactName: true,
  contactEmail: true,
  contactPhone: true,
  maxEventEntriesPerAthlete: true,
  oneDayRegistrationEnabled: true,
  oneDayBibStart: true,
  oneDayBibEnd: true,
  capacityReservationMinutes: true,
  settlementDelayDays: true,
});

const CompetitionVenueInput$ = CompetitionVenueSchema.omit({ competitionId: true }).extend({
  name: CompetitionVenueSchema.shape.name.trim().max(160),
  addressLine1: CompetitionVenueSchema.shape.addressLine1.trim().max(200),
  addressLine2: z.string().trim().max(200).nullable(),
  postalCode: CompetitionVenueSchema.shape.postalCode.trim().max(24),
  city: CompetitionVenueSchema.shape.city.trim().max(120),
  region: z.string().trim().max(120).nullable(),
  countryCode: CompetitionVenueSchema.shape.countryCode.trim().toUpperCase().length(2),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
});

export const UpdateCompetitionDetails$ = CompetitionMutationVersion$.extend(
  CompetitionDetails$.shape,
)
  .extend({
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
    venue: CompetitionVenueInput$.nullable(),
    clubEligibilityIds: z.array(Uuid$),
  })
  .superRefine((value, context) => {
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
    if (
      value.registrationClosesAt &&
      value.startsAt &&
      value.registrationClosesAt > value.startsAt
    ) {
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

const CompetitionPricingTierInput$ = CompetitionPricingTierSchema.pick({
  id: true,
  name: true,
  isDefault: true,
}).extend({
  id: Uuid$.optional(),
  name: CompetitionPricingTierSchema.shape.name.trim().min(1).max(100),
  clubIds: z.array(Uuid$),
});

export const UpdateCompetitionPricing$ = CompetitionMutationVersion$.extend({
  tiers: z.array(CompetitionPricingTierInput$).min(1),
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

const StartGroupInput$ = StartGroupSchema.pick({
  id: true,
  label: true,
  scheduledStartAt: true,
}).extend({
  id: Uuid$.optional(),
  label: StartGroupSchema.shape.label.trim().min(1).max(100),
  scheduledStartAt: OptionalDate$,
});

const RoundInput$ = RoundSchema.pick({
  id: true,
  label: true,
  scheduledStartAt: true,
}).extend({
  id: Uuid$.optional(),
  label: RoundSchema.shape.label.trim().min(1).max(100),
  scheduledStartAt: OptionalDate$,
  startGroups: z.array(StartGroupInput$),
});

const CompetitionEventPriceInput$ = CompetitionEventPriceSchema.pick({
  pricingTierId: true,
  priceCents: true,
}).extend({
  pricingTierId: Uuid$,
  priceCents: MoneyCents$,
});

const CompetitionEventInput$ = CompetitionEventSchema.pick({
  disciplineId: true,
  kind: true,
  relayLegCount: true,
  resultEntryMode: true,
  registerable: true,
  capacity: true,
}).extend({
  disciplineId: Uuid$,
  kind: CompetitionEventKind$,
  relayLegCount: z.int().positive().max(20).nullable(),
  resultEntryMode: ResultEntryMode$,
  registerable: z.boolean(),
  capacity: z.int().positive().nullable(),
});

export const UpsertCompetitionEvent$ = CompetitionMutationVersion$.extend(
  CompetitionEventInput$.shape,
)
  .extend({
    translations: z.array(TranslationInput$).min(1).max(3),
    athleteCategoryIds: z.array(Uuid$),
    prices: z.array(CompetitionEventPriceInput$),
    rounds: z.array(RoundInput$),
  })
  .superRefine((value, context) => {
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
