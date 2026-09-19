-- CreateEnum
CREATE TYPE "AppLocale" AS ENUM ('EN', 'FR', 'NL');

-- CreateEnum
CREATE TYPE "CompetitionLifecycleState" AS ENUM ('DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CompetitionRegistrationState" AS ENUM ('SCHEDULED', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisciplineMeasurement" AS ENUM ('TIME', 'DISTANCE', 'HEIGHT', 'POINTS');

-- CreateEnum
CREATE TYPE "CompetitionEventKind" AS ENUM ('INDIVIDUAL', 'COMBINED', 'RELAY');

-- CreateEnum
CREATE TYPE "ResultEntryMode" AS ENUM ('ATHLETICS_MANAGER', 'COMPETITION_MANAGER_WEB');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('NOT_STARTED', 'LIVE', 'FINISHED');

-- CreateEnum
CREATE TYPE "SeedingStatus" AS ENUM ('NOT_GENERATED', 'CURRENT', 'STALE');

-- CreateEnum
CREATE TYPE "AthleteRegistrationState" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EntryState" AS ENUM ('PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParticipationState" AS ENUM ('DECLARED', 'WITHDRAWN', 'DID_NOT_START', 'STARTED');

-- CreateEnum
CREATE TYPE "BibSource" AS ENUM ('ATHLETE_SEASON', 'COMPETITION_RANGE', 'MANUAL');

-- CreateEnum
CREATE TYPE "AdvancementState" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'PROPOSED', 'CONFIRMED', 'ELIMINATED');

-- CreateEnum
CREATE TYPE "ResultOutcome" AS ENUM ('VALID', 'DID_NOT_START', 'DID_NOT_FINISH', 'DISQUALIFIED', 'NO_MARK');

-- CreateEnum
CREATE TYPE "ResultAttemptStatus" AS ENUM ('VALID', 'FOUL', 'PASS', 'NO_ATTEMPT');

-- CreateEnum
CREATE TYPE "WaitlistState" AS ENUM ('WAITING', 'OFFERED', 'CONVERTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RegistrationCartState" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RegistrationPaymentState" AS ENUM ('PENDING', 'SUCCEEDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentAttemptState" AS ENUM ('OPEN', 'SUCCEEDED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "SettlementState" AS ENUM ('DRAFT', 'SUBMITTED', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportBatchState" AS ENUM ('PREVIEW', 'APPLIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ImportRowState" AS ENUM ('PENDING', 'APPLIED', 'UNRESOLVED', 'IGNORED');

-- CreateEnum
CREATE TYPE "ExternalEntityType" AS ENUM ('ATHLETE', 'COMPETITION_EVENT', 'ROUND', 'START_GROUP', 'ROUND_ENTRY', 'RESULT');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('ORGANIZATION', 'ATHLETE', 'COMPETITION', 'COMPETITION_EVENT', 'ROUND', 'ATHLETE_REGISTRATION', 'EVENT_ENTRY', 'RELAY_ENTRY', 'REGISTRATION_CART', 'REGISTRATION_PAYMENT', 'ORGANIZATION_SETTLEMENT', 'RESULT_IMPORT_BATCH');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'STATE_TRANSITION', 'OVERRIDE', 'CANCEL', 'TRANSFER', 'MERGE', 'REOPEN', 'OFFICIALIZE', 'REVOKE_OFFICIALIZATION', 'IMPORT', 'DELETE');

-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "deactivatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "athletics_season" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athletics_season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "countryCode" CHAR(2) NOT NULL,
    "provider" TEXT,
    "externalId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline" (
    "id" UUID NOT NULL,
    "organizationId" TEXT,
    "code" TEXT NOT NULL,
    "measurement" "DisciplineMeasurement" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discipline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline_translation" (
    "id" UUID NOT NULL,
    "disciplineId" UUID NOT NULL,
    "locale" "AppLocale" NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,

    CONSTRAINT "discipline_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_category" (
    "id" UUID NOT NULL,
    "organizationId" TEXT,
    "athleticsSeasonId" UUID,
    "provider" TEXT,
    "code" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "minimumAge" INTEGER,
    "maximumAge" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_category_translation" (
    "id" UUID NOT NULL,
    "athleteCategoryId" UUID NOT NULL,
    "locale" "AppLocale" NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,

    CONSTRAINT "athlete_category_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete" (
    "id" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "gender" TEXT NOT NULL,
    "createdForCompetitionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_external_identity" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "displayLicense" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_external_identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_season" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "athleticsSeasonId" UUID NOT NULL,
    "clubId" UUID,
    "bib" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_merge" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "deletedAthleteId" UUID NOT NULL,
    "survivingAthleteId" UUID NOT NULL,
    "deletedIdentity" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "actorUserId" TEXT,
    "mergedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_merge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "athleticsSeasonId" UUID NOT NULL,
    "primaryLocale" "AppLocale" NOT NULL DEFAULT 'EN',
    "lifecycleState" "CompetitionLifecycleState" NOT NULL DEFAULT 'DRAFT',
    "registrationState" "CompetitionRegistrationState" NOT NULL DEFAULT 'SCHEDULED',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "timeZone" TEXT,
    "registrationOpensAt" TIMESTAMP(3),
    "registrationClosesAt" TIMESTAMP(3),
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "maxEventEntriesPerAthlete" INTEGER,
    "oneDayBibStart" INTEGER,
    "oneDayBibEnd" INTEGER,
    "capacityReservationMinutes" INTEGER NOT NULL DEFAULT 15,
    "settlementDelayDays" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "officializedAt" TIMESTAMP(3),
    "officializedByUserId" TEXT,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_venue" (
    "competitionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "countryCode" CHAR(2) NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),

    CONSTRAINT "competition_venue_pkey" PRIMARY KEY ("competitionId")
);

-- CreateTable
CREATE TABLE "competition_translation" (
    "id" UUID NOT NULL,
    "competitionId" UUID NOT NULL,
    "locale" "AppLocale" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "competition_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_pricing_tier" (
    "id" UUID NOT NULL,
    "competitionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_pricing_tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_pricing_tier_club" (
    "id" UUID NOT NULL,
    "competitionId" UUID NOT NULL,
    "pricingTierId" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competition_pricing_tier_club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_club_eligibility" (
    "competitionId" UUID NOT NULL,
    "clubId" UUID NOT NULL,

    CONSTRAINT "competition_club_eligibility_pkey" PRIMARY KEY ("competitionId","clubId")
);

-- CreateTable
CREATE TABLE "competition_event" (
    "id" UUID NOT NULL,
    "competitionId" UUID NOT NULL,
    "disciplineId" UUID NOT NULL,
    "kind" "CompetitionEventKind" NOT NULL DEFAULT 'INDIVIDUAL',
    "resultEntryMode" "ResultEntryMode" NOT NULL DEFAULT 'COMPETITION_MANAGER_WEB',
    "registerable" BOOLEAN NOT NULL DEFAULT true,
    "capacity" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_event_translation" (
    "id" UUID NOT NULL,
    "competitionEventId" UUID NOT NULL,
    "locale" "AppLocale" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "competition_event_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_event_eligibility" (
    "competitionEventId" UUID NOT NULL,
    "athleteCategoryId" UUID NOT NULL,

    CONSTRAINT "competition_event_eligibility_pkey" PRIMARY KEY ("competitionEventId","athleteCategoryId")
);

-- CreateTable
CREATE TABLE "competition_event_price" (
    "id" UUID NOT NULL,
    "competitionId" UUID NOT NULL,
    "competitionEventId" UUID NOT NULL,
    "pricingTierId" UUID NOT NULL,
    "priceCents" INTEGER NOT NULL,

    CONSTRAINT "competition_event_price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combined_event_component" (
    "id" UUID NOT NULL,
    "competitionId" UUID NOT NULL,
    "combinedCompetitionEventId" UUID NOT NULL,
    "componentCompetitionEventId" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "scoringRuleVersionId" UUID,

    CONSTRAINT "combined_event_component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "round" (
    "id" UUID NOT NULL,
    "competitionEventId" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "scheduledStartAt" TIMESTAMP(3),
    "status" "RoundStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "seedingStatus" "SeedingStatus" NOT NULL DEFAULT 'NOT_GENERATED',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "start_group" (
    "id" UUID NOT NULL,
    "roundId" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "scheduledStartAt" TIMESTAMP(3),

    CONSTRAINT "start_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advancement_rule" (
    "id" UUID NOT NULL,
    "competitionEventId" UUID NOT NULL,
    "sourceRoundId" UUID NOT NULL,
    "targetRoundId" UUID NOT NULL,
    "automaticPlaceCount" INTEGER NOT NULL DEFAULT 0,
    "additionalPerformanceCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "advancement_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_rule_version" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "formula" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scoring_rule_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_registration" (
    "id" UUID NOT NULL,
    "competitionId" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "state" "AthleteRegistrationState" NOT NULL,
    "controlledByUserId" TEXT,
    "createdByUserId" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "checkedInByUserId" TEXT,
    "bib" INTEGER,
    "bibSource" "BibSource",
    "athleteFirstName" TEXT NOT NULL,
    "athleteLastName" TEXT NOT NULL,
    "athleteBirthDate" DATE NOT NULL,
    "athleteGender" TEXT NOT NULL,
    "clubId" UUID,
    "clubNameSnapshot" TEXT,
    "clubAbbreviationSnapshot" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_entry" (
    "id" UUID NOT NULL,
    "competitionId" UUID NOT NULL,
    "athleteRegistrationId" UUID NOT NULL,
    "competitionEventId" UUID NOT NULL,
    "state" "EntryState" NOT NULL,
    "participationState" "ParticipationState" NOT NULL DEFAULT 'DECLARED',
    "personalBestValue" INTEGER,
    "personalBestAchievedOn" DATE,
    "personalBestSource" TEXT,
    "athleteCategoryId" UUID,
    "categoryCodeSnapshot" TEXT NOT NULL,
    "categoryNameSnapshot" TEXT NOT NULL,
    "pricingTierId" UUID,
    "pricingTierNameSnapshot" TEXT,
    "priceCents" INTEGER,
    "priceOverridden" BOOLEAN NOT NULL DEFAULT false,
    "priceOverrideReason" TEXT,
    "capacityOverridden" BOOLEAN NOT NULL DEFAULT false,
    "capacityOverrideReason" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relay_entry" (
    "id" UUID NOT NULL,
    "competitionId" UUID NOT NULL,
    "competitionEventId" UUID NOT NULL,
    "controlledByUserId" TEXT,
    "clubId" UUID NOT NULL,
    "clubNameSnapshot" TEXT NOT NULL,
    "clubAbbreviationSnapshot" TEXT,
    "athleteCategoryId" UUID,
    "categoryCodeSnapshot" TEXT NOT NULL,
    "categoryNameSnapshot" TEXT NOT NULL,
    "state" "EntryState" NOT NULL,
    "participationState" "ParticipationState" NOT NULL DEFAULT 'DECLARED',
    "pricingTierId" UUID,
    "pricingTierNameSnapshot" TEXT,
    "priceCents" INTEGER,
    "priceOverridden" BOOLEAN NOT NULL DEFAULT false,
    "priceOverrideReason" TEXT,
    "capacityOverridden" BOOLEAN NOT NULL DEFAULT false,
    "capacityOverrideReason" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relay_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relay_leg" (
    "id" UUID NOT NULL,
    "competitionId" UUID NOT NULL,
    "relayEntryId" UUID NOT NULL,
    "athleteRegistrationId" UUID NOT NULL,
    "legOrder" INTEGER NOT NULL,

    CONSTRAINT "relay_leg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist_entry" (
    "id" UUID NOT NULL,
    "eventEntryId" UUID,
    "relayEntryId" UUID,
    "state" "WaitlistState" NOT NULL DEFAULT 'WAITING',
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "offeredAt" TIMESTAMP(3),
    "offerExpiresAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "waitlist_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "round_entry" (
    "id" UUID NOT NULL,
    "competitionEventId" UUID NOT NULL,
    "roundId" UUID NOT NULL,
    "startGroupId" UUID,
    "eventEntryId" UUID,
    "relayEntryId" UUID,
    "laneOrOrder" INTEGER,
    "participationState" "ParticipationState" NOT NULL DEFAULT 'DECLARED',
    "advancementState" "AdvancementState" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "round_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "round_result" (
    "id" UUID NOT NULL,
    "roundEntryId" UUID NOT NULL,
    "outcome" "ResultOutcome" NOT NULL,
    "performanceValue" INTEGER,
    "windHundredths" INTEGER,
    "acceptedPlace" INTEGER,
    "placeOverrideReason" TEXT,
    "points" INTEGER,
    "scoringRuleVersionId" UUID,
    "source" "ResultEntryMode" NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "round_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_attempt" (
    "id" UUID NOT NULL,
    "roundResultId" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" "ResultAttemptStatus" NOT NULL,
    "performanceValue" INTEGER,
    "windHundredths" INTEGER,

    CONSTRAINT "result_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_fee_schedule" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "fixedFeeCents" INTEGER NOT NULL,
    "variableFeeBasisPoints" INTEGER NOT NULL,
    "activeFrom" TIMESTAMP(3) NOT NULL,
    "retiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkout_fee_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_cart" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "competitionId" UUID NOT NULL,
    "submittedByUserId" TEXT,
    "state" "RegistrationCartState" NOT NULL,
    "feeScheduleId" UUID,
    "feeFixedCentsSnapshot" INTEGER NOT NULL,
    "feeBasisPointsSnapshot" INTEGER NOT NULL,
    "eventEntriesSubtotalCents" INTEGER NOT NULL,
    "checkoutFeeCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),

    CONSTRAINT "registration_cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_cart_line" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "competitionId" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "eventEntryId" UUID,
    "relayEntryId" UUID,
    "unitPriceCents" INTEGER NOT NULL,

    CONSTRAINT "registration_cart_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_payment" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "competitionId" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "payerUserId" TEXT,
    "payerNameSnapshot" TEXT NOT NULL,
    "payerEmailSnapshot" TEXT NOT NULL,
    "state" "RegistrationPaymentState" NOT NULL DEFAULT 'PENDING',
    "eventEntriesAmountCents" INTEGER NOT NULL,
    "checkoutFeeCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "succeededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_attempt" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "providerSessionId" TEXT NOT NULL,
    "state" "PaymentAttemptState" NOT NULL DEFAULT 'OPEN',
    "checkoutUrl" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "succeededAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_provider_event" (
    "providerEventId" TEXT NOT NULL,
    "paymentAttemptId" UUID,
    "eventType" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_provider_event_pkey" PRIMARY KEY ("providerEventId")
);

-- CreateTable
CREATE TABLE "payment_allocation" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "competitionId" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "cartLineId" UUID NOT NULL,
    "eventPriceCents" INTEGER NOT NULL,

    CONSTRAINT "payment_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_settlement" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "competitionId" UUID NOT NULL,
    "state" "SettlementState" NOT NULL DEFAULT 'DRAFT',
    "amountCents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "providerTransferId" TEXT,
    "adjustmentOfId" UUID,
    "createdByUserId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement_line" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "competitionId" UUID NOT NULL,
    "settlementId" UUID NOT NULL,
    "paymentAllocationId" UUID NOT NULL,
    "amountCents" INTEGER NOT NULL,

    CONSTRAINT "settlement_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_import_batch" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "competitionId" UUID NOT NULL,
    "state" "ImportBatchState" NOT NULL DEFAULT 'PREVIEW',
    "sourceChecksum" TEXT NOT NULL,
    "normalizedSummary" JSONB NOT NULL,
    "createdByUserId" TEXT,
    "previewExpiresAt" TIMESTAMP(3),
    "committedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "result_import_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_import_row" (
    "id" UUID NOT NULL,
    "importBatchId" UUID NOT NULL,
    "sourceRowKey" TEXT NOT NULL,
    "state" "ImportRowState" NOT NULL DEFAULT 'PENDING',
    "normalizedData" JSONB NOT NULL,
    "differences" JSONB,
    "error" TEXT,

    CONSTRAINT "result_import_row_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_entity_mapping" (
    "id" UUID NOT NULL,
    "competitionId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "entityType" "ExternalEntityType" NOT NULL,
    "externalId" TEXT NOT NULL,
    "internalEntityId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_entity_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_entry" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "actorUserId" TEXT,
    "actorDisplayName" TEXT,
    "actorEmail" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "athletics_season_startsOn_endsOn_idx" ON "athletics_season"("startsOn", "endsOn");

-- CreateIndex
CREATE UNIQUE INDEX "athletics_season_provider_code_key" ON "athletics_season"("provider", "code");

-- CreateIndex
CREATE INDEX "club_name_idx" ON "club"("name");

-- CreateIndex
CREATE UNIQUE INDEX "club_provider_externalId_key" ON "club"("provider", "externalId");

-- CreateIndex
CREATE INDEX "discipline_organizationId_active_idx" ON "discipline"("organizationId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "discipline_organizationId_code_key" ON "discipline"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "discipline_translation_disciplineId_locale_key" ON "discipline_translation"("disciplineId", "locale");

-- CreateIndex
CREATE INDEX "athlete_category_organizationId_active_idx" ON "athlete_category"("organizationId", "active");

-- CreateIndex
CREATE INDEX "athlete_category_athleticsSeasonId_idx" ON "athlete_category"("athleticsSeasonId");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_category_organizationId_athleticsSeasonId_code_key" ON "athlete_category"("organizationId", "athleticsSeasonId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_category_translation_athleteCategoryId_locale_key" ON "athlete_category_translation"("athleteCategoryId", "locale");

-- CreateIndex
CREATE INDEX "athlete_lastName_firstName_birthDate_idx" ON "athlete"("lastName", "firstName", "birthDate");

-- CreateIndex
CREATE INDEX "athlete_createdForCompetitionId_idx" ON "athlete"("createdForCompetitionId");

-- CreateIndex
CREATE INDEX "athlete_external_identity_athleteId_idx" ON "athlete_external_identity"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_external_identity_provider_externalId_key" ON "athlete_external_identity"("provider", "externalId");

-- CreateIndex
CREATE INDEX "athlete_season_athleticsSeasonId_clubId_idx" ON "athlete_season"("athleticsSeasonId", "clubId");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_season_athleteId_athleticsSeasonId_key" ON "athlete_season"("athleteId", "athleticsSeasonId");

-- CreateIndex
CREATE INDEX "athlete_merge_organizationId_mergedAt_idx" ON "athlete_merge"("organizationId", "mergedAt");

-- CreateIndex
CREATE INDEX "athlete_merge_survivingAthleteId_idx" ON "athlete_merge"("survivingAthleteId");

-- CreateIndex
CREATE INDEX "competition_organizationId_lifecycleState_startsAt_idx" ON "competition"("organizationId", "lifecycleState", "startsAt");

-- CreateIndex
CREATE INDEX "competition_registrationState_registrationOpensAt_registrat_idx" ON "competition"("registrationState", "registrationOpensAt", "registrationClosesAt");

-- CreateIndex
CREATE UNIQUE INDEX "competition_id_organizationId_key" ON "competition"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "competition_translation_competitionId_locale_key" ON "competition_translation"("competitionId", "locale");

-- CreateIndex
CREATE INDEX "competition_pricing_tier_competitionId_isDefault_idx" ON "competition_pricing_tier"("competitionId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "competition_pricing_tier_id_competitionId_key" ON "competition_pricing_tier"("id", "competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "competition_pricing_tier_competitionId_name_key" ON "competition_pricing_tier"("competitionId", "name");

-- CreateIndex
CREATE INDEX "competition_pricing_tier_club_pricingTierId_competitionId_idx" ON "competition_pricing_tier_club"("pricingTierId", "competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "competition_pricing_tier_club_competitionId_clubId_key" ON "competition_pricing_tier_club"("competitionId", "clubId");

-- CreateIndex
CREATE INDEX "competition_event_competitionId_active_idx" ON "competition_event"("competitionId", "active");

-- CreateIndex
CREATE INDEX "competition_event_disciplineId_idx" ON "competition_event"("disciplineId");

-- CreateIndex
CREATE UNIQUE INDEX "competition_event_id_competitionId_key" ON "competition_event"("id", "competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "competition_event_translation_competitionEventId_locale_key" ON "competition_event_translation"("competitionEventId", "locale");

-- CreateIndex
CREATE INDEX "competition_event_price_pricingTierId_competitionId_idx" ON "competition_event_price"("pricingTierId", "competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "competition_event_price_competitionEventId_pricingTierId_key" ON "competition_event_price"("competitionEventId", "pricingTierId");

-- CreateIndex
CREATE UNIQUE INDEX "combined_event_component_componentCompetitionEventId_key" ON "combined_event_component"("componentCompetitionEventId");

-- CreateIndex
CREATE INDEX "combined_event_component_competitionId_idx" ON "combined_event_component"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "combined_event_component_combinedCompetitionEventId_sequenc_key" ON "combined_event_component"("combinedCompetitionEventId", "sequence");

-- CreateIndex
CREATE INDEX "round_status_scheduledStartAt_idx" ON "round"("status", "scheduledStartAt");

-- CreateIndex
CREATE UNIQUE INDEX "round_id_competitionEventId_key" ON "round"("id", "competitionEventId");

-- CreateIndex
CREATE UNIQUE INDEX "round_competitionEventId_sequence_key" ON "round"("competitionEventId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "start_group_id_roundId_key" ON "start_group"("id", "roundId");

-- CreateIndex
CREATE UNIQUE INDEX "start_group_roundId_sequence_key" ON "start_group"("roundId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "advancement_rule_sourceRoundId_key" ON "advancement_rule"("sourceRoundId");

-- CreateIndex
CREATE INDEX "advancement_rule_targetRoundId_competitionEventId_idx" ON "advancement_rule"("targetRoundId", "competitionEventId");

-- CreateIndex
CREATE UNIQUE INDEX "advancement_rule_sourceRoundId_competitionEventId_key" ON "advancement_rule"("sourceRoundId", "competitionEventId");

-- CreateIndex
CREATE UNIQUE INDEX "scoring_rule_version_name_version_key" ON "scoring_rule_version"("name", "version");

-- CreateIndex
CREATE INDEX "athlete_registration_competitionId_athleteId_state_idx" ON "athlete_registration"("competitionId", "athleteId", "state");

-- CreateIndex
CREATE INDEX "athlete_registration_controlledByUserId_idx" ON "athlete_registration"("controlledByUserId");

-- CreateIndex
CREATE INDEX "athlete_registration_competitionId_bib_idx" ON "athlete_registration"("competitionId", "bib");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_registration_id_competitionId_key" ON "athlete_registration"("id", "competitionId");

-- CreateIndex
CREATE INDEX "event_entry_competitionEventId_state_idx" ON "event_entry"("competitionEventId", "state");

-- CreateIndex
CREATE INDEX "event_entry_competitionId_athleteRegistrationId_idx" ON "event_entry"("competitionId", "athleteRegistrationId");

-- CreateIndex
CREATE UNIQUE INDEX "event_entry_id_competitionEventId_key" ON "event_entry"("id", "competitionEventId");

-- CreateIndex
CREATE UNIQUE INDEX "event_entry_id_competitionId_key" ON "event_entry"("id", "competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "event_entry_athleteRegistrationId_competitionEventId_key" ON "event_entry"("athleteRegistrationId", "competitionEventId");

-- CreateIndex
CREATE INDEX "relay_entry_competitionEventId_state_idx" ON "relay_entry"("competitionEventId", "state");

-- CreateIndex
CREATE INDEX "relay_entry_competitionId_clubId_idx" ON "relay_entry"("competitionId", "clubId");

-- CreateIndex
CREATE UNIQUE INDEX "relay_entry_id_competitionEventId_key" ON "relay_entry"("id", "competitionEventId");

-- CreateIndex
CREATE UNIQUE INDEX "relay_entry_id_competitionId_key" ON "relay_entry"("id", "competitionId");

-- CreateIndex
CREATE INDEX "relay_leg_athleteRegistrationId_competitionId_idx" ON "relay_leg"("athleteRegistrationId", "competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "relay_leg_relayEntryId_legOrder_key" ON "relay_leg"("relayEntryId", "legOrder");

-- CreateIndex
CREATE UNIQUE INDEX "relay_leg_relayEntryId_athleteRegistrationId_key" ON "relay_leg"("relayEntryId", "athleteRegistrationId");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entry_eventEntryId_key" ON "waitlist_entry"("eventEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entry_relayEntryId_key" ON "waitlist_entry"("relayEntryId");

-- CreateIndex
CREATE INDEX "waitlist_entry_state_queuedAt_idx" ON "waitlist_entry"("state", "queuedAt");

-- CreateIndex
CREATE INDEX "round_entry_roundId_startGroupId_laneOrOrder_idx" ON "round_entry"("roundId", "startGroupId", "laneOrOrder");

-- CreateIndex
CREATE UNIQUE INDEX "round_entry_roundId_eventEntryId_key" ON "round_entry"("roundId", "eventEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "round_entry_roundId_relayEntryId_key" ON "round_entry"("roundId", "relayEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "round_result_roundEntryId_key" ON "round_result"("roundEntryId");

-- CreateIndex
CREATE INDEX "round_result_outcome_acceptedPlace_idx" ON "round_result"("outcome", "acceptedPlace");

-- CreateIndex
CREATE UNIQUE INDEX "result_attempt_roundResultId_sequence_key" ON "result_attempt"("roundResultId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "checkout_fee_schedule_version_key" ON "checkout_fee_schedule"("version");

-- CreateIndex
CREATE INDEX "checkout_fee_schedule_activeFrom_retiredAt_idx" ON "checkout_fee_schedule"("activeFrom", "retiredAt");

-- CreateIndex
CREATE INDEX "registration_cart_competitionId_state_submittedAt_idx" ON "registration_cart"("competitionId", "state", "submittedAt");

-- CreateIndex
CREATE INDEX "registration_cart_submittedByUserId_idx" ON "registration_cart"("submittedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "registration_cart_id_competitionId_organizationId_key" ON "registration_cart"("id", "competitionId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "registration_cart_line_eventEntryId_key" ON "registration_cart_line"("eventEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "registration_cart_line_relayEntryId_key" ON "registration_cart_line"("relayEntryId");

-- CreateIndex
CREATE INDEX "registration_cart_line_cartId_idx" ON "registration_cart_line"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "registration_cart_line_id_cartId_competitionId_organization_key" ON "registration_cart_line"("id", "cartId", "competitionId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "registration_cart_line_eventEntryId_competitionId_key" ON "registration_cart_line"("eventEntryId", "competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "registration_cart_line_relayEntryId_competitionId_key" ON "registration_cart_line"("relayEntryId", "competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "registration_payment_cartId_key" ON "registration_payment"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "registration_payment_cartId_competitionId_organizationId_key" ON "registration_payment"("cartId", "competitionId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "registration_payment_id_cartId_competitionId_organizationId_key" ON "registration_payment"("id", "cartId", "competitionId", "organizationId");

-- CreateIndex
CREATE INDEX "registration_payment_payerUserId_createdAt_idx" ON "registration_payment"("payerUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempt_providerSessionId_key" ON "payment_attempt"("providerSessionId");

-- CreateIndex
CREATE INDEX "payment_attempt_paymentId_state_idx" ON "payment_attempt"("paymentId", "state");

-- CreateIndex
CREATE INDEX "payment_provider_event_paymentAttemptId_idx" ON "payment_provider_event"("paymentAttemptId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_allocation_cartLineId_key" ON "payment_allocation"("cartLineId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_allocation_cartLineId_cartId_competitionId_organiza_key" ON "payment_allocation"("cartLineId", "cartId", "competitionId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_allocation_id_competitionId_organizationId_key" ON "payment_allocation"("id", "competitionId", "organizationId");

-- CreateIndex
CREATE INDEX "payment_allocation_paymentId_idx" ON "payment_allocation"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_settlement_providerTransferId_key" ON "organization_settlement"("providerTransferId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_settlement_id_competitionId_organizationId_key" ON "organization_settlement"("id", "competitionId", "organizationId");

-- CreateIndex
CREATE INDEX "organization_settlement_organizationId_competitionId_state_idx" ON "organization_settlement"("organizationId", "competitionId", "state");

-- CreateIndex
CREATE INDEX "settlement_line_paymentAllocationId_idx" ON "settlement_line"("paymentAllocationId");

-- CreateIndex
CREATE UNIQUE INDEX "settlement_line_settlementId_paymentAllocationId_key" ON "settlement_line"("settlementId", "paymentAllocationId");

-- CreateIndex
CREATE INDEX "result_import_batch_organizationId_state_createdAt_idx" ON "result_import_batch"("organizationId", "state", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "result_import_batch_competitionId_sourceChecksum_key" ON "result_import_batch"("competitionId", "sourceChecksum");

-- CreateIndex
CREATE INDEX "result_import_row_importBatchId_state_idx" ON "result_import_row"("importBatchId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "result_import_row_importBatchId_sourceRowKey_key" ON "result_import_row"("importBatchId", "sourceRowKey");

-- CreateIndex
CREATE INDEX "external_entity_mapping_internalEntityId_idx" ON "external_entity_mapping"("internalEntityId");

-- CreateIndex
CREATE UNIQUE INDEX "external_entity_mapping_competitionId_provider_entityType_e_key" ON "external_entity_mapping"("competitionId", "provider", "entityType", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "external_entity_mapping_competitionId_provider_entityType_i_key" ON "external_entity_mapping"("competitionId", "provider", "entityType", "internalEntityId");

-- CreateIndex
CREATE INDEX "audit_entry_organizationId_entityType_entityId_createdAt_idx" ON "audit_entry"("organizationId", "entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_entry_actorUserId_createdAt_idx" ON "audit_entry"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "discipline" ADD CONSTRAINT "discipline_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_translation" ADD CONSTRAINT "discipline_translation_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "discipline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_category" ADD CONSTRAINT "athlete_category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_category" ADD CONSTRAINT "athlete_category_athleticsSeasonId_fkey" FOREIGN KEY ("athleticsSeasonId") REFERENCES "athletics_season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_category_translation" ADD CONSTRAINT "athlete_category_translation_athleteCategoryId_fkey" FOREIGN KEY ("athleteCategoryId") REFERENCES "athlete_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete" ADD CONSTRAINT "athlete_createdForCompetitionId_fkey" FOREIGN KEY ("createdForCompetitionId") REFERENCES "competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_external_identity" ADD CONSTRAINT "athlete_external_identity_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_season" ADD CONSTRAINT "athlete_season_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_season" ADD CONSTRAINT "athlete_season_athleticsSeasonId_fkey" FOREIGN KEY ("athleticsSeasonId") REFERENCES "athletics_season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_season" ADD CONSTRAINT "athlete_season_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_merge" ADD CONSTRAINT "athlete_merge_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_merge" ADD CONSTRAINT "athlete_merge_survivingAthleteId_fkey" FOREIGN KEY ("survivingAthleteId") REFERENCES "athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_merge" ADD CONSTRAINT "athlete_merge_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition" ADD CONSTRAINT "competition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition" ADD CONSTRAINT "competition_athleticsSeasonId_fkey" FOREIGN KEY ("athleticsSeasonId") REFERENCES "athletics_season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition" ADD CONSTRAINT "competition_officializedByUserId_fkey" FOREIGN KEY ("officializedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition" ADD CONSTRAINT "competition_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition" ADD CONSTRAINT "competition_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_venue" ADD CONSTRAINT "competition_venue_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_translation" ADD CONSTRAINT "competition_translation_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_pricing_tier" ADD CONSTRAINT "competition_pricing_tier_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_pricing_tier_club" ADD CONSTRAINT "competition_pricing_tier_club_pricingTierId_competitionId_fkey" FOREIGN KEY ("pricingTierId", "competitionId") REFERENCES "competition_pricing_tier"("id", "competitionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_pricing_tier_club" ADD CONSTRAINT "competition_pricing_tier_club_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_club_eligibility" ADD CONSTRAINT "competition_club_eligibility_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_club_eligibility" ADD CONSTRAINT "competition_club_eligibility_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_event" ADD CONSTRAINT "competition_event_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_event" ADD CONSTRAINT "competition_event_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_event_translation" ADD CONSTRAINT "competition_event_translation_competitionEventId_fkey" FOREIGN KEY ("competitionEventId") REFERENCES "competition_event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_event_eligibility" ADD CONSTRAINT "competition_event_eligibility_competitionEventId_fkey" FOREIGN KEY ("competitionEventId") REFERENCES "competition_event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_event_eligibility" ADD CONSTRAINT "competition_event_eligibility_athleteCategoryId_fkey" FOREIGN KEY ("athleteCategoryId") REFERENCES "athlete_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_event_price" ADD CONSTRAINT "competition_event_price_competitionEventId_competitionId_fkey" FOREIGN KEY ("competitionEventId", "competitionId") REFERENCES "competition_event"("id", "competitionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_event_price" ADD CONSTRAINT "competition_event_price_pricingTierId_competitionId_fkey" FOREIGN KEY ("pricingTierId", "competitionId") REFERENCES "competition_pricing_tier"("id", "competitionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combined_event_component" ADD CONSTRAINT "combined_event_component_combinedCompetitionEventId_compet_fkey" FOREIGN KEY ("combinedCompetitionEventId", "competitionId") REFERENCES "competition_event"("id", "competitionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combined_event_component" ADD CONSTRAINT "combined_event_component_componentCompetitionEventId_compe_fkey" FOREIGN KEY ("componentCompetitionEventId", "competitionId") REFERENCES "competition_event"("id", "competitionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combined_event_component" ADD CONSTRAINT "combined_event_component_scoringRuleVersionId_fkey" FOREIGN KEY ("scoringRuleVersionId") REFERENCES "scoring_rule_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round" ADD CONSTRAINT "round_competitionEventId_fkey" FOREIGN KEY ("competitionEventId") REFERENCES "competition_event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "start_group" ADD CONSTRAINT "start_group_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advancement_rule" ADD CONSTRAINT "advancement_rule_sourceRoundId_competitionEventId_fkey" FOREIGN KEY ("sourceRoundId", "competitionEventId") REFERENCES "round"("id", "competitionEventId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advancement_rule" ADD CONSTRAINT "advancement_rule_targetRoundId_competitionEventId_fkey" FOREIGN KEY ("targetRoundId", "competitionEventId") REFERENCES "round"("id", "competitionEventId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_registration" ADD CONSTRAINT "athlete_registration_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_registration" ADD CONSTRAINT "athlete_registration_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_registration" ADD CONSTRAINT "athlete_registration_controlledByUserId_fkey" FOREIGN KEY ("controlledByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_registration" ADD CONSTRAINT "athlete_registration_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_registration" ADD CONSTRAINT "athlete_registration_checkedInByUserId_fkey" FOREIGN KEY ("checkedInByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_entry" ADD CONSTRAINT "event_entry_athleteRegistrationId_competitionId_fkey" FOREIGN KEY ("athleteRegistrationId", "competitionId") REFERENCES "athlete_registration"("id", "competitionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_entry" ADD CONSTRAINT "event_entry_competitionEventId_competitionId_fkey" FOREIGN KEY ("competitionEventId", "competitionId") REFERENCES "competition_event"("id", "competitionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_entry" ADD CONSTRAINT "event_entry_athleteCategoryId_fkey" FOREIGN KEY ("athleteCategoryId") REFERENCES "athlete_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_entry" ADD CONSTRAINT "event_entry_pricingTierId_competitionId_fkey" FOREIGN KEY ("pricingTierId", "competitionId") REFERENCES "competition_pricing_tier"("id", "competitionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_entry" ADD CONSTRAINT "relay_entry_competitionEventId_competitionId_fkey" FOREIGN KEY ("competitionEventId", "competitionId") REFERENCES "competition_event"("id", "competitionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_entry" ADD CONSTRAINT "relay_entry_controlledByUserId_fkey" FOREIGN KEY ("controlledByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_entry" ADD CONSTRAINT "relay_entry_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_entry" ADD CONSTRAINT "relay_entry_athleteCategoryId_fkey" FOREIGN KEY ("athleteCategoryId") REFERENCES "athlete_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_entry" ADD CONSTRAINT "relay_entry_pricingTierId_competitionId_fkey" FOREIGN KEY ("pricingTierId", "competitionId") REFERENCES "competition_pricing_tier"("id", "competitionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_leg" ADD CONSTRAINT "relay_leg_relayEntryId_competitionId_fkey" FOREIGN KEY ("relayEntryId", "competitionId") REFERENCES "relay_entry"("id", "competitionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_leg" ADD CONSTRAINT "relay_leg_athleteRegistrationId_competitionId_fkey" FOREIGN KEY ("athleteRegistrationId", "competitionId") REFERENCES "athlete_registration"("id", "competitionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_eventEntryId_fkey" FOREIGN KEY ("eventEntryId") REFERENCES "event_entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_relayEntryId_fkey" FOREIGN KEY ("relayEntryId") REFERENCES "relay_entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_entry" ADD CONSTRAINT "round_entry_roundId_competitionEventId_fkey" FOREIGN KEY ("roundId", "competitionEventId") REFERENCES "round"("id", "competitionEventId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_entry" ADD CONSTRAINT "round_entry_startGroupId_roundId_fkey" FOREIGN KEY ("startGroupId", "roundId") REFERENCES "start_group"("id", "roundId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_entry" ADD CONSTRAINT "round_entry_eventEntryId_competitionEventId_fkey" FOREIGN KEY ("eventEntryId", "competitionEventId") REFERENCES "event_entry"("id", "competitionEventId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_entry" ADD CONSTRAINT "round_entry_relayEntryId_competitionEventId_fkey" FOREIGN KEY ("relayEntryId", "competitionEventId") REFERENCES "relay_entry"("id", "competitionEventId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_result" ADD CONSTRAINT "round_result_roundEntryId_fkey" FOREIGN KEY ("roundEntryId") REFERENCES "round_entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_result" ADD CONSTRAINT "round_result_scoringRuleVersionId_fkey" FOREIGN KEY ("scoringRuleVersionId") REFERENCES "scoring_rule_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_attempt" ADD CONSTRAINT "result_attempt_roundResultId_fkey" FOREIGN KEY ("roundResultId") REFERENCES "round_result"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_cart" ADD CONSTRAINT "registration_cart_competitionId_organizationId_fkey" FOREIGN KEY ("competitionId", "organizationId") REFERENCES "competition"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_cart" ADD CONSTRAINT "registration_cart_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_cart" ADD CONSTRAINT "registration_cart_feeScheduleId_fkey" FOREIGN KEY ("feeScheduleId") REFERENCES "checkout_fee_schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_cart_line" ADD CONSTRAINT "registration_cart_line_cartId_competitionId_organizationId_fkey" FOREIGN KEY ("cartId", "competitionId", "organizationId") REFERENCES "registration_cart"("id", "competitionId", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_cart_line" ADD CONSTRAINT "registration_cart_line_eventEntryId_competitionId_fkey" FOREIGN KEY ("eventEntryId", "competitionId") REFERENCES "event_entry"("id", "competitionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_cart_line" ADD CONSTRAINT "registration_cart_line_relayEntryId_competitionId_fkey" FOREIGN KEY ("relayEntryId", "competitionId") REFERENCES "relay_entry"("id", "competitionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_payment" ADD CONSTRAINT "registration_payment_cartId_competitionId_organizationId_fkey" FOREIGN KEY ("cartId", "competitionId", "organizationId") REFERENCES "registration_cart"("id", "competitionId", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_payment" ADD CONSTRAINT "registration_payment_payerUserId_fkey" FOREIGN KEY ("payerUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempt" ADD CONSTRAINT "payment_attempt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "registration_payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_provider_event" ADD CONSTRAINT "payment_provider_event_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "payment_attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_paymentId_cartId_competitionId_organiza_fkey" FOREIGN KEY ("paymentId", "cartId", "competitionId", "organizationId") REFERENCES "registration_payment"("id", "cartId", "competitionId", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_cartLineId_cartId_competitionId_organiz_fkey" FOREIGN KEY ("cartLineId", "cartId", "competitionId", "organizationId") REFERENCES "registration_cart_line"("id", "cartId", "competitionId", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_settlement" ADD CONSTRAINT "organization_settlement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_settlement" ADD CONSTRAINT "organization_settlement_competitionId_organizationId_fkey" FOREIGN KEY ("competitionId", "organizationId") REFERENCES "competition"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_settlement" ADD CONSTRAINT "organization_settlement_adjustmentOfId_competitionId_organ_fkey" FOREIGN KEY ("adjustmentOfId", "competitionId", "organizationId") REFERENCES "organization_settlement"("id", "competitionId", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_settlement" ADD CONSTRAINT "organization_settlement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_line" ADD CONSTRAINT "settlement_line_settlementId_competitionId_organizationId_fkey" FOREIGN KEY ("settlementId", "competitionId", "organizationId") REFERENCES "organization_settlement"("id", "competitionId", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_line" ADD CONSTRAINT "settlement_line_paymentAllocationId_competitionId_organiza_fkey" FOREIGN KEY ("paymentAllocationId", "competitionId", "organizationId") REFERENCES "payment_allocation"("id", "competitionId", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_import_batch" ADD CONSTRAINT "result_import_batch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_import_batch" ADD CONSTRAINT "result_import_batch_competitionId_organizationId_fkey" FOREIGN KEY ("competitionId", "organizationId") REFERENCES "competition"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_import_batch" ADD CONSTRAINT "result_import_batch_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_import_row" ADD CONSTRAINT "result_import_row_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "result_import_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_entity_mapping" ADD CONSTRAINT "external_entity_mapping_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entry" ADD CONSTRAINT "audit_entry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entry" ADD CONSTRAINT "audit_entry_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Domain checks that Prisma cannot express.
ALTER TABLE "athletics_season" ADD CONSTRAINT "athletics_season_date_order" CHECK ("endsOn" >= "startsOn");
ALTER TABLE "athlete_category" ADD CONSTRAINT "athlete_category_age_range" CHECK (("minimumAge" IS NULL OR "minimumAge" >= 0) AND ("maximumAge" IS NULL OR "maximumAge" >= 0) AND ("minimumAge" IS NULL OR "maximumAge" IS NULL OR "maximumAge" >= "minimumAge"));
ALTER TABLE "competition" ADD CONSTRAINT "competition_date_order" CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "endsAt" > "startsAt");
ALTER TABLE "competition" ADD CONSTRAINT "competition_registration_date_order" CHECK ("registrationOpensAt" IS NULL OR "registrationClosesAt" IS NULL OR "registrationClosesAt" > "registrationOpensAt");
ALTER TABLE "competition" ADD CONSTRAINT "competition_positive_limits" CHECK (("maxEventEntriesPerAthlete" IS NULL OR "maxEventEntriesPerAthlete" > 0) AND "capacityReservationMinutes" > 0 AND "settlementDelayDays" >= 0);
ALTER TABLE "competition" ADD CONSTRAINT "competition_bib_range" CHECK (("oneDayBibStart" IS NULL AND "oneDayBibEnd" IS NULL) OR ("oneDayBibStart" IS NOT NULL AND "oneDayBibEnd" IS NOT NULL AND "oneDayBibStart" > 0 AND "oneDayBibEnd" >= "oneDayBibStart"));
ALTER TABLE "competition_venue" ADD CONSTRAINT "competition_venue_coordinates" CHECK (("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90) AND ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180));
ALTER TABLE "competition_event" ADD CONSTRAINT "competition_event_capacity" CHECK ("capacity" IS NULL OR "capacity" > 0);
ALTER TABLE "competition_event_price" ADD CONSTRAINT "competition_event_price_nonnegative" CHECK ("priceCents" >= 0);
ALTER TABLE "combined_event_component" ADD CONSTRAINT "combined_event_component_not_self" CHECK ("combinedCompetitionEventId" <> "componentCompetitionEventId");
ALTER TABLE "combined_event_component" ADD CONSTRAINT "combined_event_component_sequence" CHECK ("sequence" > 0);
ALTER TABLE "round" ADD CONSTRAINT "round_sequence" CHECK ("sequence" > 0);
ALTER TABLE "start_group" ADD CONSTRAINT "start_group_sequence" CHECK ("sequence" > 0);
ALTER TABLE "advancement_rule" ADD CONSTRAINT "advancement_rule_nonnegative" CHECK ("automaticPlaceCount" >= 0 AND "additionalPerformanceCount" >= 0);
ALTER TABLE "advancement_rule" ADD CONSTRAINT "advancement_rule_distinct_rounds" CHECK ("sourceRoundId" <> "targetRoundId");
ALTER TABLE "athlete_registration" ADD CONSTRAINT "athlete_registration_positive_bib" CHECK ("bib" IS NULL OR "bib" > 0);
ALTER TABLE "event_entry" ADD CONSTRAINT "event_entry_values_nonnegative" CHECK (("personalBestValue" IS NULL OR "personalBestValue" >= 0) AND ("priceCents" IS NULL OR "priceCents" >= 0));
ALTER TABLE "event_entry" ADD CONSTRAINT "event_entry_override_reasons" CHECK ((NOT "priceOverridden" OR NULLIF(BTRIM("priceOverrideReason"), '') IS NOT NULL) AND (NOT "capacityOverridden" OR NULLIF(BTRIM("capacityOverrideReason"), '') IS NOT NULL));
ALTER TABLE "relay_entry" ADD CONSTRAINT "relay_entry_price_nonnegative" CHECK ("priceCents" IS NULL OR "priceCents" >= 0);
ALTER TABLE "relay_entry" ADD CONSTRAINT "relay_entry_override_reasons" CHECK ((NOT "priceOverridden" OR NULLIF(BTRIM("priceOverrideReason"), '') IS NOT NULL) AND (NOT "capacityOverridden" OR NULLIF(BTRIM("capacityOverrideReason"), '') IS NOT NULL));
ALTER TABLE "relay_leg" ADD CONSTRAINT "relay_leg_order" CHECK ("legOrder" > 0);
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_target" CHECK (num_nonnulls("eventEntryId", "relayEntryId") = 1);
ALTER TABLE "round_entry" ADD CONSTRAINT "round_entry_target" CHECK (num_nonnulls("eventEntryId", "relayEntryId") = 1);
ALTER TABLE "round_entry" ADD CONSTRAINT "round_entry_lane_or_order" CHECK ("laneOrOrder" IS NULL OR "laneOrOrder" > 0);
ALTER TABLE "round_result" ADD CONSTRAINT "round_result_performance" CHECK (("outcome" = 'VALID' AND "performanceValue" IS NOT NULL AND "performanceValue" >= 0) OR ("outcome" <> 'VALID' AND ("performanceValue" IS NULL OR "performanceValue" >= 0)));
ALTER TABLE "round_result" ADD CONSTRAINT "round_result_place" CHECK ("acceptedPlace" IS NULL OR "acceptedPlace" > 0);
ALTER TABLE "result_attempt" ADD CONSTRAINT "result_attempt_sequence" CHECK ("sequence" > 0);
ALTER TABLE "result_attempt" ADD CONSTRAINT "result_attempt_performance" CHECK (("status" = 'VALID' AND "performanceValue" IS NOT NULL AND "performanceValue" >= 0) OR "status" <> 'VALID');
ALTER TABLE "checkout_fee_schedule" ADD CONSTRAINT "checkout_fee_schedule_values" CHECK ("fixedFeeCents" >= 0 AND "variableFeeBasisPoints" BETWEEN 0 AND 10000);
ALTER TABLE "registration_cart" ADD CONSTRAINT "registration_cart_amounts" CHECK ("feeFixedCentsSnapshot" >= 0 AND "feeBasisPointsSnapshot" BETWEEN 0 AND 10000 AND "eventEntriesSubtotalCents" >= 0 AND "checkoutFeeCents" >= 0 AND "totalCents" = "eventEntriesSubtotalCents" + "checkoutFeeCents");
ALTER TABLE "registration_cart_line" ADD CONSTRAINT "registration_cart_line_target" CHECK (num_nonnulls("eventEntryId", "relayEntryId") = 1);
ALTER TABLE "registration_cart_line" ADD CONSTRAINT "registration_cart_line_price" CHECK ("unitPriceCents" >= 0);
ALTER TABLE "registration_payment" ADD CONSTRAINT "registration_payment_amounts" CHECK ("eventEntriesAmountCents" >= 0 AND "checkoutFeeCents" >= 0 AND "totalCents" = "eventEntriesAmountCents" + "checkoutFeeCents");
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_amount" CHECK ("eventPriceCents" >= 0);
ALTER TABLE "audit_entry" ADD CONSTRAINT "audit_entry_exceptional_action_reason" CHECK (
  "action" NOT IN ('OVERRIDE', 'CANCEL', 'TRANSFER', 'MERGE', 'REOPEN', 'REVOKE_OFFICIALIZATION', 'DELETE')
  OR NULLIF(BTRIM("reason"), '') IS NOT NULL
);

-- Active claims and operational uniqueness use partial indexes because historical rows are retained.
CREATE UNIQUE INDEX "athlete_registration_one_active_claim" ON "athlete_registration"("competitionId", "athleteId") WHERE "state" IN ('PENDING_PAYMENT', 'CONFIRMED');
CREATE UNIQUE INDEX "athlete_registration_active_bib" ON "athlete_registration"("competitionId", "bib") WHERE "state" IN ('PENDING_PAYMENT', 'CONFIRMED') AND "bib" IS NOT NULL;
CREATE UNIQUE INDEX "competition_pricing_tier_one_default" ON "competition_pricing_tier"("competitionId") WHERE "isDefault" = true;
CREATE UNIQUE INDEX "payment_attempt_one_success" ON "payment_attempt"("paymentId") WHERE "state" = 'SUCCEEDED';
CREATE UNIQUE INDEX "discipline_platform_code" ON "discipline"("code") WHERE "organizationId" IS NULL;
CREATE UNIQUE INDEX "athlete_category_platform_season_code" ON "athlete_category"("athleticsSeasonId", "code") WHERE "organizationId" IS NULL;

-- Platform fee version 1: EUR 0.30 plus 10% of Event Entry prices.
INSERT INTO "checkout_fee_schedule" ("id", "version", "fixedFeeCents", "variableFeeBasisPoints", "activeFrom")
VALUES ('00000000-0000-0000-0000-000000000001', 1, 30, 1000, TIMESTAMPTZ '2026-09-19 00:00:00+00');

-- Custom catalog entries may only be used by Competitions owned by the same Organization.
CREATE FUNCTION "enforce_competition_event_discipline_scope"() RETURNS trigger AS $$
DECLARE
  competition_organization_id TEXT;
  discipline_organization_id TEXT;
BEGIN
  SELECT "organizationId" INTO competition_organization_id FROM "competition" WHERE "id" = NEW."competitionId";
  SELECT "organizationId" INTO discipline_organization_id
  FROM "discipline"
  WHERE "id" = NEW."disciplineId"
  FOR SHARE;
  IF discipline_organization_id IS NOT NULL AND discipline_organization_id <> competition_organization_id THEN
    RAISE EXCEPTION 'Competition Event cannot use another Organization''s Discipline';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "competition_event_discipline_scope"
BEFORE INSERT OR UPDATE OF "competitionId", "disciplineId" ON "competition_event"
FOR EACH ROW EXECUTE FUNCTION "enforce_competition_event_discipline_scope"();

CREATE FUNCTION "enforce_competition_event_category_scope"() RETURNS trigger AS $$
DECLARE
  competition_organization_id TEXT;
  category_organization_id TEXT;
BEGIN
  SELECT c."organizationId" INTO competition_organization_id
  FROM "competition_event" e JOIN "competition" c ON c."id" = e."competitionId"
  WHERE e."id" = NEW."competitionEventId";
  SELECT "organizationId" INTO category_organization_id
  FROM "athlete_category"
  WHERE "id" = NEW."athleteCategoryId"
  FOR SHARE;
  IF category_organization_id IS NOT NULL AND category_organization_id <> competition_organization_id THEN
    RAISE EXCEPTION 'Competition Event cannot use another Organization''s Athlete Category';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "competition_event_category_scope"
BEFORE INSERT OR UPDATE OF "competitionEventId", "athleteCategoryId" ON "competition_event_eligibility"
FOR EACH ROW EXECUTE FUNCTION "enforce_competition_event_category_scope"();

-- Catalog ownership changes must preserve the scope of every existing reference.
CREATE FUNCTION "enforce_discipline_reference_scope"() RETURNS trigger AS $$
BEGIN
  IF NEW."organizationId" IS DISTINCT FROM OLD."organizationId" AND NEW."organizationId" IS NOT NULL AND EXISTS (
    SELECT 1
    FROM "competition_event" e
    JOIN "competition" c ON c."id" = e."competitionId"
    WHERE e."disciplineId" = NEW."id"
      AND c."organizationId" <> NEW."organizationId"
  ) THEN
    RAISE EXCEPTION 'Discipline ownership change would leave a Competition Event outside its Organization scope';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "discipline_reference_scope"
BEFORE UPDATE OF "organizationId" ON "discipline"
FOR EACH ROW EXECUTE FUNCTION "enforce_discipline_reference_scope"();

CREATE FUNCTION "enforce_athlete_category_reference_scope"() RETURNS trigger AS $$
BEGIN
  IF NEW."organizationId" IS DISTINCT FROM OLD."organizationId" AND NEW."organizationId" IS NOT NULL AND EXISTS (
    SELECT 1
    FROM "competition_event_eligibility" eligibility
    JOIN "competition_event" e ON e."id" = eligibility."competitionEventId"
    JOIN "competition" c ON c."id" = e."competitionId"
    WHERE eligibility."athleteCategoryId" = NEW."id"
      AND c."organizationId" <> NEW."organizationId"
  ) THEN
    RAISE EXCEPTION 'Athlete Category ownership change would leave Competition Event eligibility outside its Organization scope';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "athlete_category_reference_scope"
BEFORE UPDATE OF "organizationId" ON "athlete_category"
FOR EACH ROW EXECUTE FUNCTION "enforce_athlete_category_reference_scope"();

-- Polymorphic import mappings must resolve to an entity of the declared type in the same Competition.
CREATE FUNCTION "enforce_external_entity_mapping_target"() RETURNS trigger AS $$
DECLARE
  target_is_valid BOOLEAN;
BEGIN
  target_is_valid := CASE NEW."entityType"
    WHEN 'ATHLETE' THEN EXISTS (
      SELECT 1
      FROM "athlete_registration" registration
      WHERE registration."competitionId" = NEW."competitionId"
        AND registration."athleteId" = NEW."internalEntityId"
    )
    WHEN 'COMPETITION_EVENT' THEN EXISTS (
      SELECT 1
      FROM "competition_event" e
      WHERE e."id" = NEW."internalEntityId"
        AND e."competitionId" = NEW."competitionId"
    )
    WHEN 'ROUND' THEN EXISTS (
      SELECT 1
      FROM "round" r
      JOIN "competition_event" e ON e."id" = r."competitionEventId"
      WHERE r."id" = NEW."internalEntityId"
        AND e."competitionId" = NEW."competitionId"
    )
    WHEN 'START_GROUP' THEN EXISTS (
      SELECT 1
      FROM "start_group" group_row
      JOIN "round" r ON r."id" = group_row."roundId"
      JOIN "competition_event" e ON e."id" = r."competitionEventId"
      WHERE group_row."id" = NEW."internalEntityId"
        AND e."competitionId" = NEW."competitionId"
    )
    WHEN 'ROUND_ENTRY' THEN EXISTS (
      SELECT 1
      FROM "round_entry" entry
      JOIN "competition_event" e ON e."id" = entry."competitionEventId"
      WHERE entry."id" = NEW."internalEntityId"
        AND e."competitionId" = NEW."competitionId"
    )
    WHEN 'RESULT' THEN EXISTS (
      SELECT 1
      FROM "round_result" result
      JOIN "round_entry" entry ON entry."id" = result."roundEntryId"
      JOIN "competition_event" e ON e."id" = entry."competitionEventId"
      WHERE result."id" = NEW."internalEntityId"
        AND e."competitionId" = NEW."competitionId"
    )
    ELSE FALSE
  END;

  IF NOT target_is_valid THEN
    RAISE EXCEPTION 'External Entity Mapping target must match its declared type and Competition';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "external_entity_mapping_target"
BEFORE INSERT OR UPDATE OF "competitionId", "entityType", "internalEntityId" ON "external_entity_mapping"
FOR EACH ROW EXECUTE FUNCTION "enforce_external_entity_mapping_target"();

-- Combined Event composition is an ordered, same-Competition tree with no shared child or cycle.
CREATE FUNCTION "prevent_combined_event_cycle"() RETURNS trigger AS $$
DECLARE
  parent_kind "CompetitionEventKind";
BEGIN
  -- Serialize graph changes for one Competition before reading its transitive closure.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW."competitionId"::TEXT, 0));

  SELECT "kind" INTO parent_kind FROM "competition_event" WHERE "id" = NEW."combinedCompetitionEventId";
  IF parent_kind <> 'COMBINED' THEN
    RAISE EXCEPTION 'Combined Event parent must have COMBINED kind';
  END IF;
  IF EXISTS (
    WITH RECURSIVE descendants("eventId") AS (
      SELECT c."componentCompetitionEventId"
      FROM "combined_event_component" c
      WHERE c."combinedCompetitionEventId" = NEW."componentCompetitionEventId" AND c."id" <> NEW."id"
      UNION
      SELECT c."componentCompetitionEventId"
      FROM "combined_event_component" c
      JOIN descendants d ON c."combinedCompetitionEventId" = d."eventId"
      WHERE c."id" <> NEW."id"
    )
    SELECT 1 FROM descendants WHERE "eventId" = NEW."combinedCompetitionEventId"
  ) THEN
    RAISE EXCEPTION 'Combined Event composition cannot contain a cycle';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "combined_event_no_cycle"
BEFORE INSERT OR UPDATE OF "combinedCompetitionEventId", "componentCompetitionEventId" ON "combined_event_component"
FOR EACH ROW EXECUTE FUNCTION "prevent_combined_event_cycle"();
