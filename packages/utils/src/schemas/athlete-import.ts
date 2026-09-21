import * as z from "zod";

import { AthleteImportStateSchema } from "../generated/prisma-zod/schemas/enums/AthleteImportState.schema";
import { AthleteImportBatchSchema } from "../generated/prisma-zod/schemas/models/AthleteImportBatch.schema";

export const AthleteImportState$ = AthleteImportStateSchema;

export const AthleteImportSeason$ = z.object({
  code: z.string().trim(),
  startsOn: z.string().trim(),
  endsOn: z.string().trim(),
  label: z.string().trim(),
  exists: z.boolean(),
  isDefault: z.boolean(),
});

export const AthleteImportSummary$ = z.object({
  rows: z.int().nonnegative(),
  athletesCreated: z.int().nonnegative(),
  athletesUpdated: z.int().nonnegative(),
  athletesUnchanged: z.int().nonnegative(),
  athleteSeasonsCreated: z.int().nonnegative(),
  athleteSeasonsUpdated: z.int().nonnegative(),
  athleteSeasonsUnchanged: z.int().nonnegative(),
  clubsCreated: z.int().nonnegative(),
  clubsUpdated: z.int().nonnegative(),
  clubsUnchanged: z.int().nonnegative(),
});

const AthleteImportBatchFields$ = AthleteImportBatchSchema.pick({
  id: true,
  provider: true,
  filename: true,
  checksum: true,
  state: true,
  errorMessage: true,
  createdAt: true,
  confirmedAt: true,
  startedAt: true,
  completedAt: true,
});

export const AthleteImportBatch$ = AthleteImportBatchFields$.extend({
  id: AthleteImportBatchSchema.shape.id.pipe(z.uuid()),
  provider: AthleteImportBatchSchema.shape.provider.pipe(z.literal("LRBA")),
  filename: AthleteImportBatchSchema.shape.filename.trim(),
  checksum: AthleteImportBatchSchema.shape.checksum.trim(),
  state: AthleteImportState$,
  season: AthleteImportSeason$,
  summary: AthleteImportSummary$,
  errorMessage: z.string().trim().nullable(),
  createdAt: z.coerce.date(),
  confirmedAt: z.coerce.date().nullable(),
  startedAt: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
});

export const AthleteImportSeasonsResponse$ = z.object({
  seasons: z.array(AthleteImportSeason$),
  defaultSeasonCode: z.string().trim(),
});

export const AthleteImportBatchResponse$ = z.object({
  batch: AthleteImportBatch$,
});

export const AthleteImportBatchesResponse$ = z.object({
  batches: z.array(AthleteImportBatch$),
});

export const AthleteImportValidationError$ = z.object({
  row: z.int().positive().nullable(),
  field: z.string().trim().nullable(),
  message: z.string().trim(),
});

export const AthleteImportValidationResponse$ = z.object({
  error: z.string().trim(),
  errors: z.array(AthleteImportValidationError$),
});

export type AthleteImportState = z.infer<typeof AthleteImportState$>;
export type AthleteImportSeason = z.infer<typeof AthleteImportSeason$>;
export type AthleteImportSummary = z.infer<typeof AthleteImportSummary$>;
export type AthleteImportBatch = z.infer<typeof AthleteImportBatch$>;
