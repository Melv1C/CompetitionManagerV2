import { describe, expect, it } from "vitest";

import { ageBands, disciplines } from "./catalogue-data";

describe("starter Belgian Athletics catalogue", () => {
  it("has stable unique codes and three translations for every platform Discipline", () => {
    expect(new Set(disciplines.map(({ code }) => code)).size).toBe(disciplines.length);
    expect(disciplines.length).toBeGreaterThan(75);
    for (const discipline of disciplines) {
      expect(discipline.names.EN).toBeTruthy();
      expect(discipline.names.FR).toBeTruthy();
      expect(discipline.names.NL).toBeTruthy();
    }
    expect(disciplines.some(({ code }) => code === "4X100M")).toBe(true);
    expect(disciplines.some(({ code }) => code.startsWith("80MH-762MM-8H-1200CM-800CM"))).toBe(
      true,
    );
    expect(disciplines.some(({ code }) => code.startsWith("80MH-762MM-8H-1200CM-700CM"))).toBe(
      true,
    );
  });

  it("keeps U23 separate from Senior and starts categories at six", () => {
    expect(ageBands[0]?.slice(0, 3)).toEqual(["KAN", 6, 7]);
    expect(ageBands.find(([code]) => code === "ESP")?.slice(1, 3)).toEqual([20, 22]);
    expect(ageBands.find(([code]) => code === "SEN")?.[1]).toBe(23);
  });
});
