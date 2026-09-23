import { describe, expect, it } from "vitest";

import {
  PublicCompetitionDetail$,
  PublicCompetitionListQuery$,
  PublicCompetitionSummary$,
} from "./public-competition";

const competitionId = "0e14fd0a-a73f-475e-9848-f761f3a761a5";

const summary = {
  id: competitionId,
  primaryLocale: "EN",
  lifecycleState: "PUBLISHED",
  registrationState: "OPEN",
  startsAt: "2027-05-24T12:00:00.000Z",
  endsAt: "2027-05-24T20:00:00.000Z",
  timeZone: "Europe/Brussels",
  registrationOpensAt: "2027-05-01T00:00:00.000Z",
  registrationClosesAt: "2027-05-20T21:59:00.000Z",
  translations: [{ locale: "EN", name: "Brussels Open", description: "Track and field." }],
  organization: {
    id: "organization-1",
    name: "Brussels Athletics",
    slug: "brussels-athletics",
    logo: null,
  },
  venue: {
    name: "Stade des Trois Tilleuls",
    addressLine1: "Avenue des Trophees 1",
    addressLine2: null,
    postalCode: "1190",
    city: "Forest",
    region: "Brussels",
    countryCode: "BE",
    latitude: 50.8,
    longitude: 4.3,
  },
  disciplines: [],
} as const;

describe("public Competition contracts", () => {
  it("accepts a published Competition summary and rejects Drafts", () => {
    expect(PublicCompetitionSummary$.parse(summary)).toEqual(summary);
    expect(
      PublicCompetitionSummary$.safeParse({ ...summary, lifecycleState: "DRAFT" }).success,
    ).toBe(false);
  });

  it("keeps legacy catalog records public when their translations are missing", () => {
    const discipline = {
      id: "9cee488f-21e7-4185-8099-cb60857504dd",
      code: "100M",
      measurement: "TIME",
      translations: [],
    };

    expect(
      PublicCompetitionSummary$.parse({ ...summary, disciplines: [discipline] }),
    ).toMatchObject({
      disciplines: [discipline],
    });
  });

  it("coerces and bounds collection query parameters", () => {
    expect(PublicCompetitionListQuery$.parse({ q: " Brussels ", limit: "3" })).toEqual({
      q: "Brussels",
      limit: 3,
    });
    expect(PublicCompetitionListQuery$.safeParse({ limit: "51" }).success).toBe(false);
  });

  it("publishes tier prices and Club labels without persistence identifiers", () => {
    const detail = PublicCompetitionDetail$.parse({
      ...summary,
      contactName: "Meeting team",
      contactEmail: "meeting@example.com",
      contactPhone: null,
      events: [],
      pricingTiers: [
        {
          name: "Partner clubs",
          isDefault: false,
          clubs: [{ name: "Brussels Athletics", abbreviation: "RBA" }],
          prices: [{ competitionEventId: competitionId, priceCents: 400 }],
        },
      ],
    });

    expect(detail.pricingTiers[0]).toEqual({
      name: "Partner clubs",
      isDefault: false,
      clubs: [{ name: "Brussels Athletics", abbreviation: "RBA" }],
      prices: [{ competitionEventId: competitionId, priceCents: 400 }],
    });
  });
});
