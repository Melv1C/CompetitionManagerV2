import { describe, expect, it } from "vitest";

import { CreateOrganization$, Organization$ } from "./organization";

const id = "A".repeat(32);

describe("Organization schemas", () => {
  it("accepts an optional Organization logo URL", () => {
    expect(
      CreateOrganization$.parse({
        name: "Brussels Athletics",
        slug: "brussels-athletics",
        logo: "https://example.com/brussels-athletics.svg",
        ownerId: id,
      }),
    ).toMatchObject({ logo: "https://example.com/brussels-athletics.svg" });

    expect(
      Organization$.parse({
        id,
        name: "Brussels Athletics",
        slug: "brussels-athletics",
        logo: null,
        createdAt: new Date("2026-09-19T00:00:00.000Z"),
        owner: { id, name: "Morgan Owner", email: "owner@example.com" },
      }).logo,
    ).toBeNull();
  });

  it("rejects a malformed Organization logo URL", () => {
    expect(
      CreateOrganization$.safeParse({
        name: "Brussels Athletics",
        slug: "brussels-athletics",
        logo: "not a URL",
        ownerId: id,
      }).success,
    ).toBe(false);
  });
});
