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
      athleticsSeasonId: season.id,
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
      athleticsSeasonId: season.id,
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
      athleticsSeasonId: season.id,
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

await prisma.$disconnect();
