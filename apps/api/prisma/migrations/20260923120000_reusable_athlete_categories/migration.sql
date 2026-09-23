-- Keep existing category IDs and their Event/Entry references intact. Older season-scoped
-- duplicates receive a distinct legacy code rather than silently merging history.
WITH duplicates AS (
  SELECT "id", row_number() OVER (
    PARTITION BY "organizationId", "code"
    ORDER BY "createdAt", "id"
  ) AS position
  FROM "athlete_category"
)
UPDATE "athlete_category" category
SET "code" = category."code" || '~' || category."id"::text
FROM duplicates
WHERE category."id" = duplicates."id" AND duplicates.position > 1;

DROP INDEX "athlete_category_platform_season_code";
DROP INDEX "athlete_category_athleticsSeasonId_idx";
DROP INDEX "athlete_category_organizationId_athleticsSeasonId_code_key";
ALTER TABLE "athlete_category" DROP CONSTRAINT "athlete_category_athleticsSeasonId_fkey";
ALTER TABLE "athlete_category" DROP COLUMN "athleticsSeasonId";

CREATE UNIQUE INDEX "athlete_category_organizationId_code_key" ON "athlete_category"("organizationId", "code");
CREATE UNIQUE INDEX "athlete_category_platform_code" ON "athlete_category"("code") WHERE "organizationId" IS NULL;
