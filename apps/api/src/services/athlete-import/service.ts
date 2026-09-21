import { randomUUID } from "node:crypto";

import { AthleteImportSummary$, type AthleteImportSummary } from "@repo/utils";

import { prisma } from "@/lib/prisma";

import { deriveLrbaClubs } from "./club-metadata";
import { dateToIsoDate, getDefaultLrbaSeason, getLrbaSeasonLabel } from "./season";
import {
  LRBA_PROVIDER,
  type LrbaAthleteRow,
  type LrbaClubMetadata,
  type LrbaSeasonDefinition,
} from "./types";

const QUERY_CHUNK_SIZE = 5_000;
const INSERT_CHUNK_SIZE = 750;
const STAGING_RETENTION_MS = 24 * 60 * 60 * 1_000;

type AthleteImportDatabase = typeof prisma;

interface AthleteImportServiceConfiguration {
  db?: AthleteImportDatabase;
  now?: () => Date;
  createWorkerJobId?: () => string;
}

interface PreviewInput {
  filename: string;
  checksum: string;
  season: LrbaSeasonDefinition;
  rows: LrbaAthleteRow[];
  createdByUserId: string;
}

interface ConfirmInput {
  batchId: string;
  checksum: string;
  rows: LrbaAthleteRow[];
  enqueue: (batchId: string, jobId: string) => Promise<string>;
}

type EnqueueAthleteImport = ConfirmInput["enqueue"];

function chunks<T>(values: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

export function createAthleteImportService({
  db = prisma,
  now = () => new Date(),
  createWorkerJobId = () => `athlete-import-${randomUUID()}`,
}: AthleteImportServiceConfiguration = {}) {
  async function listSeasons() {
    const defaultSeason = getDefaultLrbaSeason(now());
    const records = await db.athleticsSeason.findMany({
      where: { provider: LRBA_PROVIDER },
      orderBy: { startsOn: "desc" },
    });
    const seasons = records.map((record) => ({
      code: record.code,
      startsOn: dateToIsoDate(record.startsOn),
      endsOn: dateToIsoDate(record.endsOn),
      label: getLrbaSeasonLabel(
        record.code,
        dateToIsoDate(record.startsOn),
        dateToIsoDate(record.endsOn),
      ),
      exists: true,
      isDefault: record.code === defaultSeason.code,
    }));

    if (!seasons.some((season) => season.code === defaultSeason.code)) {
      seasons.unshift({ ...defaultSeason, exists: false, isDefault: true });
    }

    return { seasons, defaultSeasonCode: defaultSeason.code };
  }

  async function getBatch(batchId: string) {
    return db.athleteImportBatch.findUnique({ where: { id: batchId } });
  }

  async function listBatches() {
    return db.athleteImportBatch.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  }

  async function loadExistingAthletes(rows: LrbaAthleteRow[], athleticsSeasonId?: string) {
    const identities = [];
    for (const rowChunk of chunks(rows, QUERY_CHUNK_SIZE)) {
      identities.push(
        ...(await db.athleteExternalIdentity.findMany({
          where: {
            provider: LRBA_PROVIDER,
            externalId: { in: rowChunk.map((row) => row.license) },
          },
          include: {
            athlete: {
              include: {
                seasons: athleticsSeasonId
                  ? { where: { athleticsSeasonId }, take: 1 }
                  : { where: { id: "00000000-0000-0000-0000-000000000000" }, take: 1 },
              },
            },
          },
        })),
      );
    }
    return new Map(identities.map((identity) => [identity.externalId, identity]));
  }

  async function buildSummary(
    rows: LrbaAthleteRow[],
    clubs: LrbaClubMetadata[],
    season: LrbaSeasonDefinition,
  ): Promise<AthleteImportSummary> {
    const existingSeason = await db.athleticsSeason.findUnique({
      where: { provider_code: { provider: LRBA_PROVIDER, code: season.code } },
    });
    if (
      existingSeason &&
      (dateToIsoDate(existingSeason.startsOn) !== season.startsOn ||
        dateToIsoDate(existingSeason.endsOn) !== season.endsOn)
    ) {
      throw new Error(`LRBA season ${season.code} already exists with different dates`);
    }

    const [identities, existingClubs] = await Promise.all([
      loadExistingAthletes(rows, existingSeason?.id),
      db.club.findMany({
        where: {
          provider: LRBA_PROVIDER,
          externalId: { in: clubs.map((club) => club.externalId) },
        },
      }),
    ]);
    const clubIds = new Map(existingClubs.map((club) => [club.externalId, club.id]));
    const sourceClubs = new Map(clubs.map((club) => [club.externalId, club]));

    const summary: AthleteImportSummary = {
      rows: rows.length,
      athletesCreated: 0,
      athletesUpdated: 0,
      athletesUnchanged: 0,
      athleteSeasonsCreated: 0,
      athleteSeasonsUpdated: 0,
      athleteSeasonsUnchanged: 0,
      clubsCreated: 0,
      clubsUpdated: 0,
      clubsUnchanged: 0,
    };

    for (const club of clubs) {
      const existing = existingClubs.find((candidate) => candidate.externalId === club.externalId);
      if (!existing) summary.clubsCreated += 1;
      else if (existing.abbreviation !== club.abbreviation || !existing.active) {
        summary.clubsUpdated += 1;
      } else summary.clubsUnchanged += 1;
    }

    for (const row of rows) {
      const identity = identities.get(row.license);
      if (!identity) summary.athletesCreated += 1;
      else if (
        identity.athlete.firstName !== row.firstName ||
        identity.athlete.lastName !== row.lastName ||
        identity.athlete.gender !== row.gender ||
        dateToIsoDate(identity.athlete.birthDate) !== row.birthDate
      ) {
        summary.athletesUpdated += 1;
      } else summary.athletesUnchanged += 1;

      const athleteSeason = identity?.athlete.seasons[0];
      if (!athleteSeason) summary.athleteSeasonsCreated += 1;
      else {
        const expectedClub = sourceClubs.get(row.clubExternalId)!;
        const existingClubId = clubIds.get(expectedClub.externalId);
        if (athleteSeason.bib !== row.bib || athleteSeason.clubId !== existingClubId) {
          summary.athleteSeasonsUpdated += 1;
        } else summary.athleteSeasonsUnchanged += 1;
      }
    }

    return AthleteImportSummary$.parse(summary);
  }

  async function preview(input: PreviewInput) {
    const clubs = deriveLrbaClubs(input.rows);
    const summary = await buildSummary(input.rows, clubs, input.season);
    const existingSeason = await db.athleticsSeason.findUnique({
      where: { provider_code: { provider: LRBA_PROVIDER, code: input.season.code } },
      select: { id: true },
    });

    return db.athleteImportBatch.create({
      data: {
        provider: LRBA_PROVIDER,
        filename: input.filename,
        checksum: input.checksum,
        seasonCode: input.season.code,
        seasonStartsOn: new Date(`${input.season.startsOn}T00:00:00.000Z`),
        seasonEndsOn: new Date(`${input.season.endsOn}T00:00:00.000Z`),
        athleticsSeasonId: existingSeason?.id,
        createdByUserId: input.createdByUserId,
        summary,
      },
    });
  }

  async function dispatchQueuedBatch(
    batch: { id: string; state: string; workerJobId: string | null },
    enqueue: EnqueueAthleteImport,
  ) {
    if (batch.state !== "QUEUED") return null;

    let workerJobId = batch.workerJobId;
    if (!batch.workerJobId) {
      const proposedWorkerJobId = createWorkerJobId();
      await db.athleteImportBatch.updateMany({
        where: { id: batch.id, workerJobId: null },
        data: { workerJobId: proposedWorkerJobId },
      });
      const persisted = await db.athleteImportBatch.findUnique({
        where: { id: batch.id },
        select: { workerJobId: true },
      });
      workerJobId = persisted?.workerJobId ?? null;
    }
    if (!workerJobId) {
      const error = new Error(`Athlete import ${batch.id} has no persisted worker job ID`);
      await db.athleteImportBatch.updateMany({
        where: { id: batch.id, state: "QUEUED" },
        data: { errorMessage: `Waiting for job dispatch: ${error.message}` },
      });
      return error;
    }

    try {
      const enqueuedJobId = await enqueue(batch.id, workerJobId);
      if (enqueuedJobId !== workerJobId) {
        throw new Error(
          `BullMQ returned job ${enqueuedJobId} for athlete import dispatch ${workerJobId}`,
        );
      }
      await db.athleteImportBatch.updateMany({
        where: { id: batch.id, errorMessage: { startsWith: "Waiting for job dispatch:" } },
        data: { errorMessage: null },
      });
      return null;
    } catch (error) {
      const dispatchError =
        error instanceof Error ? error : new Error("Could not enqueue athlete import");
      await db.athleteImportBatch.updateMany({
        where: { id: batch.id, state: "QUEUED" },
        data: { errorMessage: `Waiting for job dispatch: ${dispatchError.message}` },
      });
      return dispatchError;
    }
  }

  async function reconcileQueuedImports(enqueue: EnqueueAthleteImport) {
    const queued = await db.athleteImportBatch.findMany({
      where: { state: "QUEUED" },
      select: { id: true, state: true, workerJobId: true },
    });
    const errors: Array<{ batchId: string; error: Error }> = [];
    for (const batch of queued) {
      const error = await dispatchQueuedBatch(batch, enqueue);
      if (error) errors.push({ batchId: batch.id, error });
    }
    return { queued: queued.length, errors };
  }

  async function confirm(input: ConfirmInput) {
    const batch = await getBatch(input.batchId);
    if (!batch) return null;
    if (batch.state === "QUEUED") {
      await dispatchQueuedBatch(batch, input.enqueue);
      return getBatch(batch.id);
    }
    if (["PROCESSING", "APPLIED"].includes(batch.state)) return batch;
    if (batch.checksum !== input.checksum) {
      throw new Error("The selected file does not match the previewed LRBA export");
    }

    const active = await db.athleteImportBatch.findFirst({
      where: {
        id: { not: batch.id },
        provider: batch.provider,
        seasonCode: batch.seasonCode,
        state: { in: ["QUEUED", "PROCESSING"] },
      },
      select: { id: true },
    });
    if (active) {
      throw new Error(`Another LRBA import is already active for season ${batch.seasonCode}`);
    }

    const clubs = deriveLrbaClubs(input.rows);
    const confirmedAt = now();
    const stagingExpiresAt = new Date(confirmedAt.getTime() + STAGING_RETENTION_MS);
    const workerJobId = createWorkerJobId();

    await db.$transaction(async (transaction) => {
      await transaction.athleteImportRow.deleteMany({ where: { importBatchId: batch.id } });
      await transaction.athleteImportClub.deleteMany({ where: { importBatchId: batch.id } });
      for (const rowChunk of chunks(input.rows, INSERT_CHUNK_SIZE)) {
        await transaction.athleteImportRow.createMany({
          data: rowChunk.map((row) => ({
            importBatchId: batch.id,
            sourceRow: row.sourceRow,
            license: row.license,
            bib: row.bib,
            firstName: row.firstName,
            lastName: row.lastName,
            gender: row.gender,
            birthDate: new Date(`${row.birthDate}T00:00:00.000Z`),
            clubExternalId: row.clubExternalId,
            clubAbbreviation: row.clubAbbreviation,
          })),
        });
      }
      await transaction.athleteImportClub.createMany({
        data: clubs.map((club) => ({ importBatchId: batch.id, ...club })),
      });
      await transaction.athleteImportBatch.update({
        where: { id: batch.id },
        data: {
          state: "QUEUED",
          confirmedAt,
          stagingExpiresAt,
          errorMessage: null,
          workerJobId,
        },
      });
    });

    await dispatchQueuedBatch({ id: batch.id, state: "QUEUED", workerJobId }, input.enqueue);
    return getBatch(batch.id);
  }

  return { listSeasons, listBatches, getBatch, preview, confirm, reconcileQueuedImports };
}

export const athleteImportService = createAthleteImportService();
