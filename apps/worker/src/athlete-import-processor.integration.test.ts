import { randomUUID } from "node:crypto";

import { Pool } from "pg";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { createAthleteImportProcessor } from "./athlete-import-processor";

const databaseUrl = process.env.ATHLETE_IMPORT_TEST_DATABASE_URL;
const integration = databaseUrl ? describe : describe.skip;

integration("athlete import processor", () => {
  const pool = new Pool({ connectionString: databaseUrl });

  beforeEach(async () => {
    await pool.query("DELETE FROM athlete_import_batch");
    await pool.query("DELETE FROM athlete_season");
    await pool.query("DELETE FROM athlete_external_identity");
    await pool.query("DELETE FROM athlete");
    await pool.query("DELETE FROM club");
    await pool.query("DELETE FROM athletics_season");
  });

  afterEach(async () => {
    await pool.query("DELETE FROM athlete_import_batch");
  });

  afterAll(async () => {
    await pool.end();
  });

  async function stageImport({
    firstName,
    bib,
    clubName,
    checksum,
  }: {
    firstName: string;
    bib: number;
    clubName: string;
    checksum: string;
  }) {
    const batchId = randomUUID();
    await pool.query(
      `INSERT INTO athlete_import_batch
       (id, provider, filename, checksum, state, "seasonCode", "seasonStartsOn", "seasonEndsOn", summary, "confirmedAt", "stagingExpiresAt", "createdAt", "updatedAt")
       VALUES ($1, 'LRBA', 'athletes_lrba.csv', $2, 'QUEUED', '2027', '2026-11-01', '2027-10-31', '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '24 hours', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [batchId, checksum],
    );
    await pool.query(
      `INSERT INTO athlete_import_club
       (id, "importBatchId", "externalId", name, abbreviation, "countryCode", active)
       VALUES ($1, $2, '42', $3, 'RESC', 'BE', true)`,
      [randomUUID(), batchId, clubName],
    );
    await pool.query(
      `INSERT INTO athlete_import_row
       (id, "importBatchId", "sourceRow", license, bib, "firstName", "lastName", gender, "birthDate", "clubExternalId", "clubAbbreviation")
       VALUES ($1, $2, 2, '306195854453', $3, $4, 'Bergeret', 'M', '2001-03-12', '42', 'RESC')`,
      [randomUUID(), batchId, bib, firstName],
    );
    return batchId;
  }

  it("updates LRBA athlete data without replacing curated club metadata", async () => {
    const processor = createAthleteImportProcessor({ databaseUrl: databaseUrl!, pool });
    const firstBatchId = await stageImport({
      firstName: "Jean",
      bib: 124,
      clubName: "Royal Excelsior Sports Club",
      checksum: "first",
    });
    await processor.process(firstBatchId, 0);

    const secondBatchId = await stageImport({
      firstName: "Jean-Paul",
      bib: 125,
      clubName: "Royal Excelsior Sports Club Brussels",
      checksum: "second",
    });
    await processor.process(secondBatchId, 0);

    const result = await pool.query<{
      firstName: string;
      bib: number;
      clubName: string;
      seasonCode: string;
    }>(
      `SELECT athlete."firstName", athlete_season.bib, club.name AS "clubName", athletics_season.code AS "seasonCode"
       FROM athlete
       JOIN athlete_external_identity identity ON identity."athleteId" = athlete.id
       JOIN athlete_season ON athlete_season."athleteId" = athlete.id
       JOIN athletics_season ON athletics_season.id = athlete_season."athleticsSeasonId"
       JOIN club ON club.id = athlete_season."clubId"
       WHERE identity.provider = 'LRBA' AND identity."externalId" = '306195854453'`,
    );
    expect(result.rows).toEqual([
      {
        firstName: "Jean-Paul",
        bib: 125,
        clubName: "Royal Excelsior Sports Club",
        seasonCode: "2027",
      },
    ]);
    await expect(pool.query("SELECT id FROM athlete")).resolves.toMatchObject({ rowCount: 1 });
    await expect(
      pool.query('SELECT id FROM athlete_import_row WHERE "importBatchId" IN ($1, $2)', [
        firstBatchId,
        secondBatchId,
      ]),
    ).resolves.toMatchObject({ rowCount: 0 });
  });
});
