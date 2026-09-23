import "varlock/auto-load";
import { prismaWithoutLog as prisma } from "../src/lib/prisma";
import { ageBands, disciplines } from "./catalogue-data";

// Keep the established E2E fixture IDs for these public records. Existing installations
// retain their IDs because the sync always looks up by code first.
const stableDisciplineIds: Record<string, string> = {
  "100M": "20000000-0000-4000-8000-000000000001",
  "4X100M": "20000000-0000-4000-8000-000000000002",
};
const stableCategoryIds: Record<string, string> = {
  "SEN-M": "30000000-0000-4000-8000-000000000001",
  "SEN-F": "30000000-0000-4000-8000-000000000002",
};

async function syncCatalogue() {
  for (const endingYear of [2026, 2027, 2028]) {
    const code = `${endingYear - 1}-${endingYear}`;
    await prisma.athleticsSeason.upsert({
      where: { provider_code: { provider: "LRBA", code } },
      create: {
        provider: "LRBA",
        code,
        startsOn: new Date(`${endingYear - 1}-11-01T00:00:00Z`),
        endsOn: new Date(`${endingYear}-10-31T00:00:00Z`),
      },
      update: {},
    });
  }

  for (const item of disciplines) {
    const existing = await prisma.discipline.findFirst({
      where: { organizationId: null, code: item.code },
    });
    if (existing && existing.measurement !== item.measurement) {
      throw new Error(`Discipline ${item.code} has a different measurement; create a new code`);
    }
    const discipline =
      existing ??
      (await prisma.discipline.create({
        data: {
          id: stableDisciplineIds[item.code],
          code: item.code,
          measurement: item.measurement,
        },
      }));
    for (const locale of ["EN", "FR", "NL"] as const) {
      await prisma.disciplineTranslation.createMany({
        data: [{ disciplineId: discipline.id, locale, name: item.names[locale] }],
        skipDuplicates: true,
      });
    }
  }

  const categories = [
    ...ageBands.flatMap(([band, , , en, fr, nl]) => [
      {
        code: `${band}-M`,
        gender: "M",
        names: { EN: `${en} men`, FR: `${fr} hommes`, NL: `${nl} mannen` },
      },
      {
        code: `${band}-F`,
        gender: "F",
        names: { EN: `${en} women`, FR: `${fr} femmes`, NL: `${nl} vrouwen` },
      },
    ]),
    ...Array.from({ length: 14 }, (_, index) => 35 + index * 5).flatMap((min) => [
      {
        code: `M${min}`,
        gender: "M",
        names: {
          EN: `Masters men ${min}–${min + 4}`,
          FR: `Masters hommes ${min}–${min + 4}`,
          NL: `Masters mannen ${min}–${min + 4}`,
        },
      },
      {
        code: `W${min}`,
        gender: "F",
        names: {
          EN: `Masters women ${min}–${min + 4}`,
          FR: `Masters femmes ${min}–${min + 4}`,
          NL: `Masters vrouwen ${min}–${min + 4}`,
        },
      },
    ]),
  ];

  for (const item of categories) {
    const existing = await prisma.athleteCategory.findFirst({
      where: { organizationId: null, code: item.code },
    });
    if (existing && existing.gender !== item.gender) {
      throw new Error(`Athlete Category ${item.code} has a different gender`);
    }
    const category =
      existing ??
      (await prisma.athleteCategory.create({
        data: {
          id: stableCategoryIds[item.code],
          provider: "LRBA",
          code: item.code,
          gender: item.gender,
        },
      }));
    for (const locale of ["EN", "FR", "NL"] as const) {
      await prisma.athleteCategoryTranslation.createMany({
        data: [
          {
            athleteCategoryId: category.id,
            locale,
            name: item.names[locale],
            abbreviation: item.code,
          },
        ],
        skipDuplicates: true,
      });
    }
  }

  console.log(
    `Belgian Athletics catalogue ready: ${disciplines.length} Disciplines, ${categories.length} Athlete Categories`,
  );
}

try {
  await syncCatalogue();
} finally {
  await prisma.$disconnect();
}
