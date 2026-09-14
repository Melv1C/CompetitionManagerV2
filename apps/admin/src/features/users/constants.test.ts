import { describe, expect, it } from "vitest";

import { formatDate, formatRelativeTime, getInitials, getRoleConfig } from "./constants";

describe("user constants and formatters", () => {
  it("falls back to user role config when role is missing", () => {
    expect(getRoleConfig(undefined).label).toBe("User");
    expect(getRoleConfig("admin").label).toBe("Admin");
  });

  it("formats absolute and relative dates", () => {
    const now = Date.now();

    expect(formatDate("2026-05-29T10:30:00.000Z")).toContain("May 29, 2026");
    expect(formatRelativeTime(new Date(now - 30 * 1000))).toBe("Just now");
    expect(formatRelativeTime(new Date(now - 15 * 60 * 1000))).toBe("15m ago");
    expect(formatRelativeTime(new Date(now - 3 * 60 * 60 * 1000))).toBe("3h ago");
    expect(formatRelativeTime(new Date(now - 2 * 24 * 60 * 60 * 1000))).toBe("2d ago");
  });

  it("builds two-character uppercase initials", () => {
    expect(getInitials("Jane Admin")).toBe("JA");
    expect(getInitials("single")).toBe("S");
    expect(getInitials("Mary Jane Watson")).toBe("MJ");
  });
});
