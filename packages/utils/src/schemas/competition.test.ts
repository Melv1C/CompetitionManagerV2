import { describe, expect, it } from "vitest";

import {
  AppLocale$,
  CompetitionEventKind$,
  CreateCompetition$,
  UpsertCompetitionEvent$,
} from "./competition";

const id = "0e14fd0a-a73f-475e-9848-f761f3a761a5";

describe("Competition schemas", () => {
  it("shares the database locale enum with Competition commands", () => {
    expect(AppLocale$.options).toEqual(["EN", "FR", "NL"]);
    expect(
      CreateCompetition$.parse({
        athleticsSeasonId: id,
        primaryLocale: "FR",
        name: "  Meeting de Bruxelles  ",
      }),
    ).toEqual({
      athleticsSeasonId: id,
      primaryLocale: "FR",
      name: "Meeting de Bruxelles",
    });
  });

  it("narrows generated Event kinds to the kinds supported by the manager", () => {
    expect(CompetitionEventKind$.options).toEqual(["INDIVIDUAL", "RELAY"]);

    const result = UpsertCompetitionEvent$.safeParse({
      expectedUpdatedAt: new Date(),
      disciplineId: id,
      kind: "COMBINED",
      relayLegCount: null,
      resultEntryMode: "COMPETITION_MANAGER_WEB",
      registerable: true,
      capacity: null,
      translations: [{ locale: "EN", name: "Pentathlon", description: "" }],
      athleteCategoryIds: [],
      prices: [],
      rounds: [],
    });

    expect(result.success).toBe(false);
  });
});
