import { z } from "zod";

export const clubCreateRequestSchema = z
  .object({
    name: z.string().trim().min(2, "Club name must be at least 2 characters").max(120),
  })
  .strict();

export const clubSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const clubMembershipSchema = z.object({
  id: z.string(),
  clubId: z.string(),
  userId: z.string(),
  role: z.literal("manager"),
  createdAt: z.string().datetime(),
});

export const clubResponseSchema = z.object({
  club: clubSchema,
  membership: clubMembershipSchema,
});

export const clubListResponseSchema = z.object({
  clubs: z.array(clubResponseSchema),
});

export type ClubCreateRequest = z.infer<typeof clubCreateRequestSchema>;
export type Club = z.infer<typeof clubSchema>;
export type ClubMembership = z.infer<typeof clubMembershipSchema>;
export type ClubResponse = z.infer<typeof clubResponseSchema>;
export type ClubListResponse = z.infer<typeof clubListResponseSchema>;
