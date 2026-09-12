import { z } from "zod";

export const authUserSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    emailVerified: z.boolean(),
    image: z.string().nullable().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .passthrough();

export const authSessionSchema = z
  .object({
    id: z.string(),
    expiresAt: z.string().datetime(),
    token: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    userId: z.string(),
  })
  .passthrough();

export const authSessionResponseSchema = z.object({
  session: authSessionSchema,
  user: authUserSchema,
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;
