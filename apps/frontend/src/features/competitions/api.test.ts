import { describe, expect, it } from "vitest";

import { publicCompetitionKeys, publicCompetitionQuery } from "./api";

describe("public Competition queries", () => {
  it("serializes filters and an opaque cursor for the Hono client", () => {
    expect(
      publicCompetitionQuery(
        { q: "Brussels", disciplineId: "30000000-0000-4000-8000-000000000001", limit: 3 },
        "next-page",
      ),
    ).toEqual({
      q: "Brussels",
      disciplineId: "30000000-0000-4000-8000-000000000001",
      cursor: "next-page",
      limit: "3",
    });
  });

  it("keeps each filter set in a distinct cache entry", () => {
    expect(publicCompetitionKeys.list({ q: "Brussels", limit: 12 })).not.toEqual(
      publicCompetitionKeys.list({ q: "Ghent", limit: 12 }),
    );
  });
});
