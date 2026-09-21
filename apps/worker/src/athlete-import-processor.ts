import { Pool, type PoolClient } from "pg";

const LRBA_PROVIDER_LOCK = "athlete-import:LRBA";

interface AthleteImportProcessorConfiguration {
  databaseUrl: string;
  pool?: Pool;
}

interface AthleteImportBatchRecord {
  id: string;
  provider: string;
  seasonCode: string;
  seasonStartsOn: Date | string;
  seasonEndsOn: Date | string;
  state: string;
}

function toIsoDate(value: Date | string) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

async function applyImport(client: PoolClient, batchId: string) {
  // Keep this as parameterized, set-based SQL. The advisory transaction lock, temporary target
  // table, and bulk upserts are PostgreSQL operations that Prisma would still expose as raw SQL;
  // replacing them with per-row client calls would make large imports slower and less atomic.
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [LRBA_PROVIDER_LOCK]);
    const batchResult = await client.query<AthleteImportBatchRecord>(
      `SELECT id, provider, "seasonCode", "seasonStartsOn", "seasonEndsOn", state
       FROM athlete_import_batch
       WHERE id = $1
       FOR UPDATE`,
      [batchId],
    );
    const batch = batchResult.rows[0];
    if (!batch) throw new Error(`Athlete import ${batchId} was not found`);
    if (batch.state === "APPLIED") {
      await client.query("COMMIT");
      return;
    }
    if (batch.state !== "PROCESSING") {
      throw new Error(`Athlete import ${batchId} is ${batch.state}, expected PROCESSING`);
    }

    const staged = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM athlete_import_row WHERE "importBatchId" = $1`,
      [batchId],
    );
    if (staged.rows[0]?.count === "0") throw new Error("Athlete import has no staged rows");

    await client.query(
      `INSERT INTO athletics_season (id, provider, code, "startsOn", "endsOn", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (provider, code) DO NOTHING`,
      [batch.provider, batch.seasonCode, batch.seasonStartsOn, batch.seasonEndsOn],
    );
    const seasonResult = await client.query<{
      id: string;
      startsOn: Date | string;
      endsOn: Date | string;
    }>(`SELECT id, "startsOn", "endsOn" FROM athletics_season WHERE provider = $1 AND code = $2`, [
      batch.provider,
      batch.seasonCode,
    ]);
    const season = seasonResult.rows[0];
    if (!season) throw new Error(`LRBA season ${batch.seasonCode} could not be created`);
    if (
      toIsoDate(season.startsOn) !== toIsoDate(batch.seasonStartsOn) ||
      toIsoDate(season.endsOn) !== toIsoDate(batch.seasonEndsOn)
    ) {
      throw new Error(`LRBA season ${batch.seasonCode} has conflicting dates`);
    }

    await client.query(
      `INSERT INTO club (id, name, abbreviation, "countryCode", provider, "externalId", active, "createdAt", "updatedAt")
       SELECT gen_random_uuid(), name, abbreviation, "countryCode", $2, "externalId", active, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       FROM athlete_import_club
       WHERE "importBatchId" = $1
       ON CONFLICT (provider, "externalId") DO UPDATE SET
         abbreviation = EXCLUDED.abbreviation,
         active = EXCLUDED.active,
         "updatedAt" = CURRENT_TIMESTAMP`,
      [batchId, batch.provider],
    );

    await client.query(
      `CREATE TEMP TABLE athlete_import_target (
         license TEXT PRIMARY KEY,
         "athleteId" UUID NOT NULL,
         "isNew" BOOLEAN NOT NULL
       ) ON COMMIT DROP`,
    );
    await client.query(
      `INSERT INTO athlete_import_target (license, "athleteId", "isNew")
       SELECT row.license, COALESCE(identity."athleteId", gen_random_uuid()), identity.id IS NULL
       FROM athlete_import_row row
       LEFT JOIN athlete_external_identity identity
         ON identity.provider = $2 AND identity."externalId" = row.license
       WHERE row."importBatchId" = $1`,
      [batchId, batch.provider],
    );
    await client.query(
      `INSERT INTO athlete (id, "firstName", "lastName", "birthDate", gender, "createdForCompetitionId", "createdAt", "updatedAt")
       SELECT target."athleteId", row."firstName", row."lastName", row."birthDate", row.gender, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       FROM athlete_import_target target
       JOIN athlete_import_row row ON row.license = target.license AND row."importBatchId" = $1
       WHERE target."isNew"`,
      [batchId],
    );
    await client.query(
      `INSERT INTO athlete_external_identity (id, "athleteId", provider, "externalId", "displayLicense", "createdAt", "updatedAt")
       SELECT gen_random_uuid(), target."athleteId", $1, target.license, target.license, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       FROM athlete_import_target target
       WHERE target."isNew"`,
      [batch.provider],
    );
    await client.query(
      `UPDATE athlete athlete
       SET "firstName" = row."firstName", "lastName" = row."lastName", "birthDate" = row."birthDate",
           gender = row.gender, "updatedAt" = CURRENT_TIMESTAMP
       FROM athlete_import_target target
       JOIN athlete_import_row row ON row.license = target.license AND row."importBatchId" = $1
       WHERE athlete.id = target."athleteId"`,
      [batchId],
    );
    await client.query(
      `INSERT INTO athlete_season (id, "athleteId", "athleticsSeasonId", "clubId", bib, "createdAt", "updatedAt")
       SELECT gen_random_uuid(), target."athleteId", $2, club.id, row.bib, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       FROM athlete_import_target target
       JOIN athlete_import_row row ON row.license = target.license AND row."importBatchId" = $1
       JOIN club ON club.provider = $3 AND club."externalId" = row."clubExternalId"
       ON CONFLICT ("athleteId", "athleticsSeasonId") DO UPDATE SET
         "clubId" = EXCLUDED."clubId", bib = EXCLUDED.bib, "updatedAt" = CURRENT_TIMESTAMP`,
      [batchId, season.id, batch.provider],
    );

    await client.query(
      `UPDATE athlete_import_batch
       SET state = 'APPLIED', "athleticsSeasonId" = $2, "completedAt" = CURRENT_TIMESTAMP,
           "stagingExpiresAt" = NULL, "errorMessage" = NULL, "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [batchId, season.id],
    );
    await client.query(`DELETE FROM athlete_import_row WHERE "importBatchId" = $1`, [batchId]);
    await client.query(`DELETE FROM athlete_import_club WHERE "importBatchId" = $1`, [batchId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export function createAthleteImportProcessor({
  databaseUrl,
  pool = new Pool({ connectionString: databaseUrl }),
}: AthleteImportProcessorConfiguration) {
  let cleanupTimer: ReturnType<typeof setInterval> | undefined;

  async function cleanupExpired() {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `DELETE FROM athlete_import_row
         WHERE "importBatchId" IN (
           SELECT id FROM athlete_import_batch
           WHERE "stagingExpiresAt" <= CURRENT_TIMESTAMP AND state IN ('FAILED', 'EXPIRED')
         )`,
      );
      await client.query(
        `DELETE FROM athlete_import_club
         WHERE "importBatchId" IN (
           SELECT id FROM athlete_import_batch
           WHERE "stagingExpiresAt" <= CURRENT_TIMESTAMP AND state IN ('FAILED', 'EXPIRED')
         )`,
      );
      await client.query(
        `UPDATE athlete_import_batch
         SET state = 'EXPIRED', "stagingExpiresAt" = NULL, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "stagingExpiresAt" <= CURRENT_TIMESTAMP AND state = 'FAILED'`,
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  return {
    async process(importBatchId: string, attemptsMade: number) {
      const existing = await pool.query<{ state: string }>(
        `SELECT state FROM athlete_import_batch WHERE id = $1`,
        [importBatchId],
      );
      if (existing.rows[0]?.state === "APPLIED") return;

      await pool.query(
        `UPDATE athlete_import_batch
         SET state = 'PROCESSING', "startedAt" = COALESCE("startedAt", CURRENT_TIMESTAMP), "updatedAt" = CURRENT_TIMESTAMP
         WHERE id = $1 AND state IN ('QUEUED', 'PROCESSING')`,
        [importBatchId],
      );

      let client: PoolClient | undefined;
      try {
        client = await pool.connect();
        await applyImport(client, importBatchId);
      } catch (error) {
        const terminal = attemptsMade >= 2;
        const message = error instanceof Error ? error.message : "Athlete import failed";
        await pool.query(
          `UPDATE athlete_import_batch
           SET state = $2, "errorMessage" = $3, "updatedAt" = CURRENT_TIMESTAMP
           WHERE id = $1 AND state <> 'APPLIED'`,
          [importBatchId, terminal ? "FAILED" : "QUEUED", message],
        );
        throw error;
      } finally {
        client?.release();
      }
    },
    startCleanup(onError: (error: Error) => void = () => undefined) {
      const runCleanup = () => {
        void cleanupExpired().catch((error: unknown) =>
          onError(error instanceof Error ? error : new Error("Athlete import cleanup failed")),
        );
      };
      runCleanup();
      cleanupTimer = setInterval(runCleanup, 60 * 60 * 1_000);
    },
    cleanupExpired,
    async close() {
      if (cleanupTimer) clearInterval(cleanupTimer);
      await pool.end();
    },
  };
}
