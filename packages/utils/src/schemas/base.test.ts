import { describe, expect, it } from "vitest";

import { BetterAuthId$, Boolean$, Date$, ParameterId$ } from "./base";

describe("base schemas", () => {
  it("coerces positive route ids from string parameters", () => {
    expect(ParameterId$.parse("42")).toBe(42);
    expect(() => ParameterId$.parse("0")).toThrow();
    expect(() => ParameterId$.parse("1.5")).toThrow();
  });

  it("validates Better Auth ids after trimming", () => {
    const id = "A".repeat(32);

    expect(BetterAuthId$.parse(` ${id} `)).toBe(id);
    expect(() => BetterAuthId$.parse("too-short")).toThrow();
  });

  it("parses iso dates and string booleans", () => {
    expect(Date$.parse("2026-05-29T10:00:00.000Z")).toEqual(new Date("2026-05-29T10:00:00.000Z"));
    expect(Boolean$.parse("true")).toBe(true);
    expect(Boolean$.parse("false")).toBe(false);
  });
});
