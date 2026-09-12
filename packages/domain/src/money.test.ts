import { describe, expect, it } from "vitest";

import { addMoney, createMoney } from "./money";

describe("money values", () => {
  it.each([
    [0, 0],
    [125, 125],
    [10_000, 10_000],
  ])("stores %i cents without floating point conversion", (amountCents, expected) => {
    expect(createMoney(amountCents)).toEqual({ amountCents: expected, currency: "EUR" });
  });

  it("adds only amounts with the same currency", () => {
    expect(addMoney(createMoney(125), createMoney(375))).toEqual({
      amountCents: 500,
      currency: "EUR",
    });
  });
});
