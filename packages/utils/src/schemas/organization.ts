import * as z from "zod";

import { BetterAuthId$, Date$ } from "./base";

export const OrganizationOwner$ = z.object({
  id: BetterAuthId$,
  name: z.string().trim().min(1),
  email: z.email(),
});
export type OrganizationOwner = z.infer<typeof OrganizationOwner$>;

export const Organization$ = z.object({
  id: BetterAuthId$,
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  createdAt: Date$,
  owner: OrganizationOwner$,
});
export type Organization = z.infer<typeof Organization$>;

export const CreateOrganization$ = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  ownerId: BetterAuthId$,
});
export type CreateOrganization = z.infer<typeof CreateOrganization$>;

export const OrganizationsResponse$ = z.object({
  organizations: z.array(Organization$),
});

export const OrganizationResponse$ = z.object({
  organization: Organization$,
});

export const OrganizationOwnerCandidatesQuery$ = z.object({
  search: z.string().trim().max(100).optional(),
});

export const OrganizationOwnerCandidatesResponse$ = z.object({
  users: z.array(OrganizationOwner$),
});
