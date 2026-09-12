import { describe, expect, it } from "vitest";

import { clubCreateRequestSchema, clubListResponseSchema, clubResponseSchema } from "./clubs";

const club = {
  id: "club-1",
  name: "Brussels Athletics Club",
  createdAt: "2026-09-12T20:00:00.000Z",
  updatedAt: "2026-09-12T20:00:00.000Z",
};

const membership = {
  id: "membership-1",
  clubId: "club-1",
  userId: "user-1",
  role: "manager",
  createdAt: "2026-09-12T20:00:00.000Z",
};

describe("Club contracts", () => {
  it("accepts the minimal profile and trims the display name", () => {
    expect(clubCreateRequestSchema.parse({ name: "  Brussels Athletics Club  " })).toEqual({
      name: "Brussels Athletics Club",
    });
  });

  it("rejects blank names and client-provided identity or role fields", () => {
    expect(clubCreateRequestSchema.safeParse({ name: " " }).success).toBe(false);
    expect(
      clubCreateRequestSchema.safeParse({
        name: "Club",
        userId: "attacker",
        role: "owner",
      }).success,
    ).toBe(false);
  });

  it("validates a created Club and its manager membership", () => {
    const result = clubResponseSchema.parse({ club, membership });
    expect(result.membership.role).toBe("manager");
    expect(clubListResponseSchema.parse({ clubs: [result] }).clubs).toHaveLength(1);
  });
});
