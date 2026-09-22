import * as z from "zod";

import { AppLocaleSchema } from "../generated/prisma-zod/schemas/enums/AppLocale.schema";
import { CompetitionEventKindSchema } from "../generated/prisma-zod/schemas/enums/CompetitionEventKind.schema";
import { CompetitionLifecycleStateSchema } from "../generated/prisma-zod/schemas/enums/CompetitionLifecycleState.schema";
import { CompetitionRegistrationStateSchema } from "../generated/prisma-zod/schemas/enums/CompetitionRegistrationState.schema";
import { DisciplineMeasurementSchema } from "../generated/prisma-zod/schemas/enums/DisciplineMeasurement.schema";
import { RoundStatusSchema } from "../generated/prisma-zod/schemas/enums/RoundStatus.schema";
import { AthleteCategorySchema } from "../generated/prisma-zod/schemas/models/AthleteCategory.schema";
import { AthleteCategoryTranslationSchema } from "../generated/prisma-zod/schemas/models/AthleteCategoryTranslation.schema";
import { ClubSchema } from "../generated/prisma-zod/schemas/models/Club.schema";
import { CompetitionSchema } from "../generated/prisma-zod/schemas/models/Competition.schema";
import { CompetitionEventSchema } from "../generated/prisma-zod/schemas/models/CompetitionEvent.schema";
import { CompetitionEventTranslationSchema } from "../generated/prisma-zod/schemas/models/CompetitionEventTranslation.schema";
import { CompetitionPricingTierSchema } from "../generated/prisma-zod/schemas/models/CompetitionPricingTier.schema";
import { CompetitionTranslationSchema } from "../generated/prisma-zod/schemas/models/CompetitionTranslation.schema";
import { CompetitionVenueSchema } from "../generated/prisma-zod/schemas/models/CompetitionVenue.schema";
import { DisciplineSchema } from "../generated/prisma-zod/schemas/models/Discipline.schema";
import { DisciplineTranslationSchema } from "../generated/prisma-zod/schemas/models/DisciplineTranslation.schema";
import { OrganizationSchema } from "../generated/prisma-zod/schemas/models/Organization.schema";
import { RoundSchema } from "../generated/prisma-zod/schemas/models/Round.schema";

const Uuid$ = z.uuid();
const IsoDateTime$ = z.iso.datetime();

export const PublicCompetitionListQuery$ = z.object({
  q: z.string().trim().max(100).optional(),
  disciplineId: Uuid$.optional(),
  cursor: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const PublicCompetitionIdParams$ = z.object({ competitionId: Uuid$ });

export const PublicCompetitionTranslation$ = CompetitionTranslationSchema.pick({
  locale: true,
  name: true,
  description: true,
});

export const PublicCompetitionEventTranslation$ = CompetitionEventTranslationSchema.pick({
  locale: true,
  name: true,
  description: true,
}).extend({ description: CompetitionEventTranslationSchema.shape.description.nullable() });

export const PublicDisciplineTranslation$ = DisciplineTranslationSchema.pick({
  locale: true,
  name: true,
  abbreviation: true,
}).extend({ abbreviation: DisciplineTranslationSchema.shape.abbreviation.nullable() });

export const PublicAthleteCategoryTranslation$ = AthleteCategoryTranslationSchema.pick({
  locale: true,
  name: true,
  abbreviation: true,
}).extend({ abbreviation: AthleteCategoryTranslationSchema.shape.abbreviation.nullable() });

export const PublicOrganization$ = OrganizationSchema.pick({
  id: true,
  name: true,
  slug: true,
  logo: true,
}).extend({ logo: OrganizationSchema.shape.logo.nullable() });

export const PublicCompetitionVenue$ = CompetitionVenueSchema.omit({ competitionId: true }).extend({
  addressLine2: CompetitionVenueSchema.shape.addressLine2.nullable(),
  region: CompetitionVenueSchema.shape.region.nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

export const PublicDiscipline$ = DisciplineSchema.pick({
  id: true,
  code: true,
  measurement: true,
}).extend({
  id: Uuid$,
  measurement: DisciplineMeasurementSchema,
  translations: z.array(PublicDisciplineTranslation$).min(1),
});

export const PublicAthleteCategory$ = AthleteCategorySchema.pick({ id: true, code: true }).extend({
  id: Uuid$,
  translations: z.array(PublicAthleteCategoryTranslation$).min(1),
});

const PublicCompetitionBase$ = CompetitionSchema.pick({
  id: true,
  primaryLocale: true,
  lifecycleState: true,
  registrationState: true,
  startsAt: true,
  endsAt: true,
  timeZone: true,
  registrationOpensAt: true,
  registrationClosesAt: true,
}).extend({
  id: Uuid$,
  primaryLocale: AppLocaleSchema,
  lifecycleState: CompetitionLifecycleStateSchema.exclude(["DRAFT"]),
  registrationState: CompetitionRegistrationStateSchema,
  startsAt: IsoDateTime$,
  endsAt: IsoDateTime$,
  timeZone: z.string().trim().min(1),
  registrationOpensAt: IsoDateTime$,
  registrationClosesAt: IsoDateTime$,
  translations: z.array(PublicCompetitionTranslation$).min(1),
  organization: PublicOrganization$,
  venue: PublicCompetitionVenue$,
});

export const PublicCompetitionSummary$ = PublicCompetitionBase$.extend({
  disciplines: z.array(PublicDiscipline$),
});

export const PublicRound$ = RoundSchema.pick({
  id: true,
  sequence: true,
  label: true,
  scheduledStartAt: true,
  status: true,
}).extend({
  id: Uuid$,
  scheduledStartAt: IsoDateTime$,
  status: RoundStatusSchema,
  startGroupCount: z.int().min(0),
});

export const PublicCompetitionEvent$ = CompetitionEventSchema.pick({
  id: true,
  kind: true,
  registerable: true,
}).extend({
  id: Uuid$,
  kind: CompetitionEventKindSchema,
  translations: z.array(PublicCompetitionEventTranslation$).min(1),
  discipline: PublicDiscipline$,
  eligibility: z.array(PublicAthleteCategory$),
  rounds: z.array(PublicRound$),
});

export const PublicClub$ = ClubSchema.pick({ name: true, abbreviation: true }).extend({
  abbreviation: ClubSchema.shape.abbreviation.nullable(),
});

export const PublicCompetitionTierPrice$ = z.object({
  competitionEventId: Uuid$,
  priceCents: z.int().min(0),
});

export const PublicCompetitionPricingTier$ = CompetitionPricingTierSchema.pick({
  name: true,
  isDefault: true,
}).extend({
  clubs: z.array(PublicClub$),
  prices: z.array(PublicCompetitionTierPrice$),
});

export const PublicCompetitionDetail$ = PublicCompetitionBase$.extend({
  contactName: CompetitionSchema.shape.contactName.nullable(),
  contactEmail: z.email().nullable(),
  contactPhone: CompetitionSchema.shape.contactPhone.nullable(),
  events: z.array(PublicCompetitionEvent$),
  pricingTiers: z.array(PublicCompetitionPricingTier$),
});

export const PublicCompetitionListResponse$ = z.object({
  competitions: z.array(PublicCompetitionSummary$),
  disciplines: z.array(PublicDiscipline$),
  nextCursor: z.string().trim().nullable(),
});

export const PublicCompetitionResponse$ = z.object({ competition: PublicCompetitionDetail$ });

export type PublicCompetitionListQuery = z.infer<typeof PublicCompetitionListQuery$>;
export type PublicCompetitionSummary = z.infer<typeof PublicCompetitionSummary$>;
export type PublicCompetitionDetail = z.infer<typeof PublicCompetitionDetail$>;
export type PublicCompetitionListResponse = z.infer<typeof PublicCompetitionListResponse$>;
