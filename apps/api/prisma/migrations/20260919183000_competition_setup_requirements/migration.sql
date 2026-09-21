ALTER TABLE "competition"
ADD COLUMN "oneDayRegistrationEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "competition_event"
ADD COLUMN "relayLegCount" INTEGER;

UPDATE "competition_event"
SET "relayLegCount" = 4
WHERE "kind" = 'RELAY';

ALTER TABLE "competition_event"
ADD CONSTRAINT "competition_event_relay_legs" CHECK (
  ("kind" = 'RELAY' AND "relayLegCount" IS NOT NULL AND "relayLegCount" > 0)
  OR ("kind" <> 'RELAY' AND "relayLegCount" IS NULL)
);
