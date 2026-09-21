-- CreateEnum
CREATE TYPE "AthleteImportState" AS ENUM ('PREVIEW', 'QUEUED', 'PROCESSING', 'APPLIED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "athlete_import_batch" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "state" "AthleteImportState" NOT NULL DEFAULT 'PREVIEW',
    "seasonCode" TEXT NOT NULL,
    "seasonStartsOn" DATE NOT NULL,
    "seasonEndsOn" DATE NOT NULL,
    "athleticsSeasonId" UUID,
    "createdByUserId" TEXT,
    "summary" JSONB NOT NULL,
    "errorMessage" TEXT,
    "workerJobId" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "stagingExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_import_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_import_row" (
    "id" UUID NOT NULL,
    "importBatchId" UUID NOT NULL,
    "sourceRow" INTEGER NOT NULL,
    "license" TEXT NOT NULL,
    "bib" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "clubExternalId" TEXT NOT NULL,
    "clubAbbreviation" TEXT NOT NULL,

    CONSTRAINT "athlete_import_row_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_import_club" (
    "id" UUID NOT NULL,
    "importBatchId" UUID NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "athlete_import_club_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "athlete_import_batch_provider_seasonCode_checksum_key" ON "athlete_import_batch"("provider", "seasonCode", "checksum");
CREATE INDEX "athlete_import_batch_provider_seasonCode_state_idx" ON "athlete_import_batch"("provider", "seasonCode", "state");
CREATE INDEX "athlete_import_batch_createdAt_idx" ON "athlete_import_batch"("createdAt");
CREATE UNIQUE INDEX "athlete_import_row_importBatchId_license_key" ON "athlete_import_row"("importBatchId", "license");
CREATE INDEX "athlete_import_row_importBatchId_clubExternalId_idx" ON "athlete_import_row"("importBatchId", "clubExternalId");
CREATE UNIQUE INDEX "athlete_import_club_importBatchId_externalId_key" ON "athlete_import_club"("importBatchId", "externalId");

-- Prevent two active imports from targeting the same provider season.
CREATE UNIQUE INDEX "athlete_import_batch_one_active_per_season"
ON "athlete_import_batch"("provider", "seasonCode")
WHERE "state" IN ('QUEUED', 'PROCESSING');

-- AddForeignKey
ALTER TABLE "athlete_import_batch" ADD CONSTRAINT "athlete_import_batch_athleticsSeasonId_fkey" FOREIGN KEY ("athleticsSeasonId") REFERENCES "athletics_season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "athlete_import_batch" ADD CONSTRAINT "athlete_import_batch_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "athlete_import_row" ADD CONSTRAINT "athlete_import_row_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "athlete_import_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "athlete_import_club" ADD CONSTRAINT "athlete_import_club_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "athlete_import_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "athlete_import_batch" ADD CONSTRAINT "athlete_import_batch_season_dates" CHECK ("seasonEndsOn" >= "seasonStartsOn");
ALTER TABLE "athlete_import_row" ADD CONSTRAINT "athlete_import_row_bib_positive" CHECK ("bib" > 0);
