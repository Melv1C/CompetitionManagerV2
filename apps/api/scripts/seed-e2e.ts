import "varlock/auto-load";
import { ENV } from "varlock/env";

import { prismaWithoutLog as prisma } from "../src/lib/prisma";

if (ENV.APP_ENV !== "test") {
  throw new Error("The e2e seed may run only with APP_ENV=test");
}

const users = {
  owner: "competition-owner.e2e@example.com",
  staff: "staff.e2e@example.com",
  member: "member.e2e@example.com",
  secondOwner: "second-owner.e2e@example.com",
};

const organizations = {
  primary: "e2e-athletics-organization",
  secondary: "e2e-secondary-organization",
};

const [owner, staff, member, secondOwner, primary, secondary] = await Promise.all([
  prisma.user.findUniqueOrThrow({ where: { email: users.owner } }),
  prisma.user.findUniqueOrThrow({ where: { email: users.staff } }),
  prisma.user.findUniqueOrThrow({ where: { email: users.member } }),
  prisma.user.findUniqueOrThrow({ where: { email: users.secondOwner } }),
  prisma.organization.findUniqueOrThrow({ where: { slug: organizations.primary } }),
  prisma.organization.findUniqueOrThrow({ where: { slug: organizations.secondary } }),
]);

async function setMembership(userId: string, organizationId: string, role: string) {
  const existing = await prisma.member.findFirst({ where: { userId, organizationId } });
  if (existing) {
    await prisma.member.update({ where: { id: existing.id }, data: { role } });
    return;
  }
  await prisma.member.create({
    data: {
      id: crypto.randomUUID().replaceAll("-", ""),
      userId,
      organizationId,
      role,
      createdAt: new Date(),
    },
  });
}

await Promise.all([
  setMembership(owner.id, primary.id, "owner"),
  setMembership(staff.id, primary.id, "staff"),
  setMembership(staff.id, secondary.id, "staff"),
  setMembership(member.id, primary.id, "member"),
  setMembership(secondOwner.id, secondary.id, "owner"),
]);

const season = await prisma.athleticsSeason.upsert({
  where: { provider_code: { provider: "E2E", code: "2026-2027" } },
  create: {
    id: "10000000-0000-4000-8000-000000000001",
    provider: "E2E",
    code: "2026-2027",
    startsOn: new Date("2026-09-01T00:00:00.000Z"),
    endsOn: new Date("2027-08-31T00:00:00.000Z"),
  },
  update: {},
});

await Promise.all([
  prisma.discipline.upsert({
    where: { id: "20000000-0000-4000-8000-000000000001" },
    create: {
      id: "20000000-0000-4000-8000-000000000001",
      code: "100M",
      measurement: "TIME",
      translations: {
        create: [
          { locale: "EN", name: "100 metres", abbreviation: "100 m" },
          { locale: "FR", name: "100 mètres", abbreviation: "100 m" },
          { locale: "NL", name: "100 meter", abbreviation: "100 m" },
        ],
      },
    },
    update: { active: true },
  }),
  prisma.discipline.upsert({
    where: { id: "20000000-0000-4000-8000-000000000099" },
    create: {
      id: "20000000-0000-4000-8000-000000000099",
      organizationId: secondary.id,
      code: "PRIVATE-200M",
      measurement: "TIME",
      translations: {
        create: [
          { locale: "EN", name: "Secondary Organization 200 metres", abbreviation: "200 m" },
        ],
      },
    },
    update: { active: true },
  }),
  prisma.discipline.upsert({
    where: { id: "20000000-0000-4000-8000-000000000002" },
    create: {
      id: "20000000-0000-4000-8000-000000000002",
      code: "4X100M",
      measurement: "TIME",
      translations: {
        create: [
          { locale: "EN", name: "4 × 100 metres", abbreviation: "4 × 100 m" },
          { locale: "FR", name: "4 × 100 mètres", abbreviation: "4 × 100 m" },
          { locale: "NL", name: "4 × 100 meter", abbreviation: "4 × 100 m" },
        ],
      },
    },
    update: { active: true },
  }),
  prisma.athleteCategory.upsert({
    where: { id: "30000000-0000-4000-8000-000000000001" },
    create: {
      id: "30000000-0000-4000-8000-000000000001",
      provider: "E2E",
      code: "SEN-M",
      gender: "M",
      minimumAge: 20,
      translations: {
        create: [
          { locale: "EN", name: "Senior men", abbreviation: "SEN M" },
          { locale: "FR", name: "Seniors hommes", abbreviation: "SEN H" },
          { locale: "NL", name: "Senioren mannen", abbreviation: "SEN M" },
        ],
      },
    },
    update: { active: true },
  }),
  prisma.athleteCategory.upsert({
    where: { id: "30000000-0000-4000-8000-000000000099" },
    create: {
      id: "30000000-0000-4000-8000-000000000099",
      organizationId: secondary.id,
      provider: "E2E",
      code: "PRIVATE-U18",
      gender: "X",
      maximumAge: 17,
      translations: {
        create: [
          {
            locale: "EN",
            name: "Secondary Organization under 18",
            abbreviation: "U18",
          },
        ],
      },
    },
    update: { active: true },
  }),
  prisma.athleteCategory.upsert({
    where: { id: "30000000-0000-4000-8000-000000000002" },
    create: {
      id: "30000000-0000-4000-8000-000000000002",
      provider: "E2E",
      code: "SEN-W",
      gender: "F",
      minimumAge: 20,
      translations: {
        create: [
          { locale: "EN", name: "Senior women", abbreviation: "SEN W" },
          { locale: "FR", name: "Seniors femmes", abbreviation: "SEN F" },
          { locale: "NL", name: "Senioren vrouwen", abbreviation: "SEN V" },
        ],
      },
    },
    update: { active: true },
  }),
  prisma.club.upsert({
    where: { provider_externalId: { provider: "E2E", externalId: "BRU" } },
    create: {
      id: "40000000-0000-4000-8000-000000000001",
      name: "Brussels Athletics",
      abbreviation: "BRU",
      countryCode: "BE",
      provider: "E2E",
      externalId: "BRU",
    },
    update: { active: true },
  }),
  prisma.club.upsert({
    where: { provider_externalId: { provider: "E2E", externalId: "GNT" } },
    create: {
      id: "40000000-0000-4000-8000-000000000002",
      name: "Ghent Track Club",
      abbreviation: "GNT",
      countryCode: "BE",
      provider: "E2E",
      externalId: "GNT",
    },
    update: { active: true },
  }),
]);

const publicCompetitionId = "60000000-0000-4000-8000-000000000001";
const draftCompetitionId = "60000000-0000-4000-8000-000000000002";
const standardTierId = "70000000-0000-4000-8000-000000000001";
const partnerTierId = "70000000-0000-4000-8000-000000000002";
const sprintEventId = "80000000-0000-4000-8000-000000000001";
const relayEventId = "80000000-0000-4000-8000-000000000002";
const sprintRoundId = "90000000-0000-4000-8000-000000000001";
const relayRoundId = "90000000-0000-4000-8000-000000000002";
const primaryClub = await prisma.club.findUniqueOrThrow({
  where: { provider_externalId: { provider: "E2E", externalId: "BRU" } },
});

// These records are owned entirely by the E2E fixture. Recreate them so rerunning the seed cannot
// preserve stale nested data from an earlier fixture version.
await prisma.competition.deleteMany({
  where: { id: { in: [publicCompetitionId, draftCompetitionId] } },
});

await prisma.competition.upsert({
  where: { id: publicCompetitionId },
  create: {
    id: publicCompetitionId,
    organizationId: primary.id,
    athleticsSeasonId: season.id,
    primaryLocale: "EN",
    lifecycleState: "PUBLISHED",
    registrationState: "OPEN",
    startsAt: new Date("2030-05-24T11:00:00.000Z"),
    endsAt: new Date("2030-05-24T19:00:00.000Z"),
    timeZone: "Europe/Brussels",
    registrationOpensAt: new Date("2030-05-01T07:00:00.000Z"),
    registrationClosesAt: new Date("2030-05-20T21:59:00.000Z"),
    contactName: "E2E Meeting Team",
    contactEmail: "meeting.e2e@example.com",
    contactPhone: "+32 2 555 01 01",
    publishedAt: new Date("2026-09-22T00:00:00.000Z"),
  },
  update: {
    lifecycleState: "PUBLISHED",
    registrationState: "OPEN",
    startsAt: new Date("2030-05-24T11:00:00.000Z"),
    endsAt: new Date("2030-05-24T19:00:00.000Z"),
  },
});

await Promise.all([
  prisma.competitionTranslation.upsert({
    where: { competitionId_locale: { competitionId: publicCompetitionId, locale: "EN" } },
    create: {
      competitionId: publicCompetitionId,
      locale: "EN",
      name: "E2E Brussels Open",
      description: "A multilingual afternoon of sprint and relay racing in Brussels.",
    },
    update: {
      name: "E2E Brussels Open",
      description: "A multilingual afternoon of sprint and relay racing in Brussels.",
    },
  }),
  prisma.competitionTranslation.upsert({
    where: { competitionId_locale: { competitionId: publicCompetitionId, locale: "FR" } },
    create: {
      competitionId: publicCompetitionId,
      locale: "FR",
      name: "Open de Bruxelles E2E",
      description: "Un après-midi multilingue de sprint et de relais à Bruxelles.",
    },
    update: { name: "Open de Bruxelles E2E" },
  }),
  prisma.competitionVenue.upsert({
    where: { competitionId: publicCompetitionId },
    create: {
      competitionId: publicCompetitionId,
      name: "King Baudouin Stadium",
      addressLine1: "Marathonlaan 135",
      postalCode: "1020",
      city: "Brussels",
      region: "Brussels",
      countryCode: "BE",
    },
    update: { name: "King Baudouin Stadium", city: "Brussels" },
  }),
]);

await Promise.all([
  prisma.competitionPricingTier.upsert({
    where: { id: standardTierId },
    create: {
      id: standardTierId,
      competitionId: publicCompetitionId,
      name: "Standard",
      isDefault: true,
    },
    update: { name: "Standard", isDefault: true },
  }),
  prisma.competitionPricingTier.upsert({
    where: { id: partnerTierId },
    create: {
      id: partnerTierId,
      competitionId: publicCompetitionId,
      name: "Partner clubs",
      isDefault: false,
    },
    update: { name: "Partner clubs", isDefault: false },
  }),
  prisma.competitionEvent.upsert({
    where: { id: sprintEventId },
    create: {
      id: sprintEventId,
      competitionId: publicCompetitionId,
      disciplineId: "20000000-0000-4000-8000-000000000001",
      kind: "INDIVIDUAL",
      registerable: true,
    },
    update: { active: true, registerable: true },
  }),
  prisma.competitionEvent.upsert({
    where: { id: relayEventId },
    create: {
      id: relayEventId,
      competitionId: publicCompetitionId,
      disciplineId: "20000000-0000-4000-8000-000000000002",
      kind: "RELAY",
      relayLegCount: 4,
      registerable: false,
    },
    update: { active: true, registerable: false },
  }),
]);

await Promise.all([
  prisma.competitionPricingTierClub.upsert({
    where: {
      competitionId_clubId: { competitionId: publicCompetitionId, clubId: primaryClub.id },
    },
    create: {
      competitionId: publicCompetitionId,
      pricingTierId: partnerTierId,
      clubId: primaryClub.id,
    },
    update: { pricingTierId: partnerTierId },
  }),
  prisma.competitionEventTranslation.upsert({
    where: { competitionEventId_locale: { competitionEventId: sprintEventId, locale: "EN" } },
    create: {
      competitionEventId: sprintEventId,
      locale: "EN",
      name: "Senior 100 metres",
      description: "Final",
    },
    update: { name: "Senior 100 metres" },
  }),
  prisma.competitionEventTranslation.upsert({
    where: { competitionEventId_locale: { competitionEventId: sprintEventId, locale: "FR" } },
    create: {
      competitionEventId: sprintEventId,
      locale: "FR",
      name: "100 mètres seniors",
      description: "Finale",
    },
    update: { name: "100 mètres seniors" },
  }),
  prisma.competitionEventTranslation.upsert({
    where: { competitionEventId_locale: { competitionEventId: relayEventId, locale: "EN" } },
    create: {
      competitionEventId: relayEventId,
      locale: "EN",
      name: "4 × 100 metres relay",
      description: null,
    },
    update: { name: "4 × 100 metres relay" },
  }),
  prisma.competitionEventEligibility.upsert({
    where: {
      competitionEventId_athleteCategoryId: {
        competitionEventId: sprintEventId,
        athleteCategoryId: "30000000-0000-4000-8000-000000000001",
      },
    },
    create: {
      competitionEventId: sprintEventId,
      athleteCategoryId: "30000000-0000-4000-8000-000000000001",
    },
    update: {},
  }),
  prisma.competitionEventEligibility.upsert({
    where: {
      competitionEventId_athleteCategoryId: {
        competitionEventId: relayEventId,
        athleteCategoryId: "30000000-0000-4000-8000-000000000002",
      },
    },
    create: {
      competitionEventId: relayEventId,
      athleteCategoryId: "30000000-0000-4000-8000-000000000002",
    },
    update: {},
  }),
]);

await Promise.all([
  prisma.competitionEventPrice.upsert({
    where: {
      competitionEventId_pricingTierId: {
        competitionEventId: sprintEventId,
        pricingTierId: standardTierId,
      },
    },
    create: {
      competitionId: publicCompetitionId,
      competitionEventId: sprintEventId,
      pricingTierId: standardTierId,
      priceCents: 600,
    },
    update: { priceCents: 600 },
  }),
  prisma.competitionEventPrice.upsert({
    where: {
      competitionEventId_pricingTierId: {
        competitionEventId: sprintEventId,
        pricingTierId: partnerTierId,
      },
    },
    create: {
      competitionId: publicCompetitionId,
      competitionEventId: sprintEventId,
      pricingTierId: partnerTierId,
      priceCents: 400,
    },
    update: { priceCents: 400 },
  }),
  prisma.round.upsert({
    where: { id: sprintRoundId },
    create: {
      id: sprintRoundId,
      competitionEventId: sprintEventId,
      sequence: 1,
      label: "Final",
      scheduledStartAt: new Date("2030-05-24T12:20:00.000Z"),
    },
    update: { scheduledStartAt: new Date("2030-05-24T12:20:00.000Z") },
  }),
  prisma.round.upsert({
    where: { id: relayRoundId },
    create: {
      id: relayRoundId,
      competitionEventId: relayEventId,
      sequence: 1,
      label: "Final",
      scheduledStartAt: new Date("2030-05-24T15:00:00.000Z"),
    },
    update: { scheduledStartAt: new Date("2030-05-24T15:00:00.000Z") },
  }),
]);

await Promise.all([
  prisma.startGroup.upsert({
    where: { roundId_sequence: { roundId: sprintRoundId, sequence: 1 } },
    create: { roundId: sprintRoundId, sequence: 1, label: "Heat 1" },
    update: { label: "Heat 1" },
  }),
  prisma.startGroup.upsert({
    where: { roundId_sequence: { roundId: sprintRoundId, sequence: 2 } },
    create: { roundId: sprintRoundId, sequence: 2, label: "Heat 2" },
    update: { label: "Heat 2" },
  }),
]);

await prisma.competition.upsert({
  where: { id: draftCompetitionId },
  create: {
    id: draftCompetitionId,
    organizationId: primary.id,
    athleticsSeasonId: season.id,
    primaryLocale: "EN",
    translations: {
      create: { locale: "EN", name: "Private E2E Draft", description: "Not public." },
    },
  },
  update: { lifecycleState: "DRAFT" },
});

await prisma.$disconnect();
