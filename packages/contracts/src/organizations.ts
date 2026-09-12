import { z } from "zod";

export const organizationCreateRequestSchema = z
  .object({
    name: z.string().trim().min(2, "Organization name must be at least 2 characters").max(120),
    slug: z
      .string()
      .trim()
      .min(2, "Organization slug must be at least 2 characters")
      .max(80)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Organization slug must use lowercase letters, numbers, and hyphens",
      ),
    ownerUserId: z.string().trim().min(1, "An owner is required"),
  })
  .strict();

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const organizationMembershipSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  role: z.literal("owner"),
  createdAt: z.string().datetime(),
});

export const organizationResponseSchema = z.object({
  organization: organizationSchema,
  membership: organizationMembershipSchema,
});

export const organizationListResponseSchema = z.object({
  organizations: z.array(organizationResponseSchema),
});

export const eligibleUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.literal(true),
});

export const eligibleUserListResponseSchema = z.object({
  users: z.array(eligibleUserSchema),
});

export type OrganizationCreateRequest = z.infer<typeof organizationCreateRequestSchema>;
export type Organization = z.infer<typeof organizationSchema>;
export type OrganizationMembership = z.infer<typeof organizationMembershipSchema>;
export type OrganizationResponse = z.infer<typeof organizationResponseSchema>;
export type OrganizationListResponse = z.infer<typeof organizationListResponseSchema>;
export type EligibleUser = z.infer<typeof eligibleUserSchema>;
export type EligibleUserListResponse = z.infer<typeof eligibleUserListResponseSchema>;
