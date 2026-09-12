import { describe, expect, it } from "vitest";

import {
  eligibleUserListResponseSchema,
  organizationCreateRequestSchema,
  organizationResponseSchema,
} from "./organizations";

describe("Organization contracts", () => {
  it("validates the admin creation payload and rejects client role input", () => {
    expect(
      organizationCreateRequestSchema.safeParse({
        name: "Brussels Athletics Organization",
        slug: "brussels-athletics-organization",
        ownerUserId: "user-1",
        role: "owner",
      }).success,
    ).toBe(false);
  });

  it("accepts stable Organization and eligible-user responses", () => {
    expect(
      organizationResponseSchema.parse({
        organization: {
          id: "organization-1",
          name: "Brussels Athletics Organization",
          slug: "brussels-athletics-organization",
          createdAt: "2026-09-12T20:00:00.000Z",
          updatedAt: "2026-09-12T20:00:00.000Z",
        },
        membership: {
          id: "membership-1",
          organizationId: "organization-1",
          userId: "user-1",
          role: "owner",
          createdAt: "2026-09-12T20:00:00.000Z",
        },
      }),
    ).toMatchObject({ organization: { slug: "brussels-athletics-organization" } });
    expect(
      eligibleUserListResponseSchema.parse({
        users: [{ id: "user-1", name: "Owner", email: "owner@example.test", emailVerified: true }],
      }).users,
    ).toHaveLength(1);
  });
});
