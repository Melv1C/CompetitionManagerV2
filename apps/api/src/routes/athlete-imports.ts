import { createHash } from "node:crypto";

import { zValidator } from "@hono/zod-validator";
import {
  AthleteImportBatchResponse$,
  AthleteImportBatchesResponse$,
  AthleteImportSeasonsResponse$,
  AthleteImportSummary$,
} from "@repo/utils";
import { Hono } from "hono";
import * as z from "zod";

import { getApiJobProducer } from "@/lib/job-producer";
import { isAdmin } from "@/middlewares/use-auth";
import { parseLrbaAthleteExport } from "@/services/athlete-import/parser";
import {
  dateToIsoDate,
  getDefaultLrbaSeason,
  getLrbaSeasonLabel,
} from "@/services/athlete-import/season";
import { athleteImportService } from "@/services/athlete-import/service";

const MAX_FILE_SIZE = 20 * 1_024 * 1_024;

export interface UploadedFile {
  name: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

const UploadedFile$ = z.custom<UploadedFile>((value) => value instanceof File, {
  error: "Upload an LRBA CSV file",
});

const UploadForm$ = z.object({
  file: UploadedFile$,
  seasonCode: z.string().trim().min(1),
});

const ConfirmForm$ = z.object({
  file: UploadedFile$,
  batchId: z.uuid(),
});

function checksum(contents: ArrayBuffer) {
  return createHash("sha256").update(new Uint8Array(contents)).digest("hex");
}

function validateFile(file: UploadedFile) {
  if (!file.name.toLowerCase().endsWith(".csv")) return "Select the LRBA .csv export";
  if (file.size === 0) return "The selected LRBA export is empty";
  if (file.size > MAX_FILE_SIZE) return "The selected LRBA export exceeds 20 MiB";
  return null;
}

function serializeBatch(batch: Awaited<ReturnType<typeof athleteImportService.getBatch>>) {
  if (!batch) return null;
  const startsOn = dateToIsoDate(batch.seasonStartsOn);
  const endsOn = dateToIsoDate(batch.seasonEndsOn);
  const defaultSeason = getDefaultLrbaSeason();
  return AthleteImportBatchResponse$.parse({
    batch: {
      id: batch.id,
      provider: batch.provider,
      filename: batch.filename,
      checksum: batch.checksum,
      state: batch.state,
      season: {
        code: batch.seasonCode,
        startsOn,
        endsOn,
        label: getLrbaSeasonLabel(batch.seasonCode, startsOn, endsOn),
        exists: batch.athleticsSeasonId !== null,
        isDefault: batch.seasonCode === defaultSeason.code,
      },
      summary: AthleteImportSummary$.parse(batch.summary),
      errorMessage: batch.errorMessage,
      createdAt: batch.createdAt,
      confirmedAt: batch.confirmedAt,
      startedAt: batch.startedAt,
      completedAt: batch.completedAt,
    },
  });
}

async function readUpload(file: UploadedFile) {
  const fileError = validateFile(file);
  if (fileError) return { error: fileError } as const;
  const bytes = await file.arrayBuffer();
  const parsed = parseLrbaAthleteExport(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!parsed.success) {
    return { error: "The LRBA export is invalid", errors: parsed.errors } as const;
  }
  return { rows: parsed.rows, checksum: checksum(bytes) } as const;
}

export const athleteImportsRoutes = new Hono()
  .use("*", isAdmin)
  .get("/seasons", async (c) => {
    return c.json(AthleteImportSeasonsResponse$.parse(await athleteImportService.listSeasons()));
  })
  .get("/", async (c) => {
    const batches = await athleteImportService.listBatches();
    return c.json(
      AthleteImportBatchesResponse$.parse({
        batches: batches.map((batch) => serializeBatch(batch)!.batch),
      }),
    );
  })
  .get("/:batchId", zValidator("param", z.object({ batchId: z.uuid() })), async (c) => {
    const batch = await athleteImportService.getBatch(c.req.valid("param").batchId);
    if (!batch) return c.json({ error: "Athlete import was not found" }, 404);
    return c.json(serializeBatch(batch)!);
  })
  .post("/preview", zValidator("form", UploadForm$), async (c) => {
    const { file, seasonCode } = c.req.valid("form");
    const upload = await readUpload(file).catch((error) => ({
      error: error instanceof Error ? error.message : "The LRBA export could not be read",
    }));
    if ("error" in upload) {
      return c.json({ error: upload.error, errors: "errors" in upload ? upload.errors : [] }, 422);
    }

    const available = await athleteImportService.listSeasons();
    const season = available.seasons.find((candidate) => candidate.code === seasonCode);
    if (!season) return c.json({ error: "Select a valid LRBA athletics season" }, 400);

    try {
      const user = c.get("user")!;
      const batch = await athleteImportService.preview({
        filename: file.name,
        checksum: upload.checksum,
        season,
        rows: upload.rows,
        createdByUserId: user.id,
      });
      return c.json(serializeBatch(batch)!, 201);
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : "Could not preview the LRBA import" },
        422,
      );
    }
  })
  .post("/confirm", zValidator("form", ConfirmForm$), async (c) => {
    const { file, batchId } = c.req.valid("form");
    const upload = await readUpload(file).catch((error) => ({
      error: error instanceof Error ? error.message : "The LRBA export could not be read",
    }));
    if ("error" in upload) {
      return c.json({ error: upload.error, errors: "errors" in upload ? upload.errors : [] }, 422);
    }

    try {
      const batch = await athleteImportService.confirm({
        batchId,
        checksum: upload.checksum,
        rows: upload.rows,
        enqueue: (id) => getApiJobProducer().athleteImport(id),
      });
      if (!batch) return c.json({ error: "Athlete import was not found" }, 404);
      return c.json(serializeBatch(batch)!);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not confirm the LRBA import";
      const status = message.includes("already active") ? 409 : 422;
      return c.json({ error: message }, status);
    }
  });
