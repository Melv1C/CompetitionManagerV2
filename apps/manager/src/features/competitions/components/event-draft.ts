import type { UpsertCompetitionEvent } from "@repo/utils";

import type { Competition, CompetitionEvent } from "@/features/competitions";
import { instantToZonedInput, requireValidZonedDate } from "@/features/competitions/date-time";

export type RoundDraft = {
  key: string;
  label: string;
  scheduledStartAt: string;
  startGroups: Array<{ key: string; label: string; scheduledStartAt: string }>;
};

export type EventDraft = {
  disciplineId: string;
  kind: UpsertCompetitionEvent["kind"];
  relayLegCount: string;
  resultEntryMode: UpsertCompetitionEvent["resultEntryMode"];
  registerable: boolean;
  capacity: string;
  name: string;
  description: string;
  categoryIds: string[];
  prices: Record<string, string>;
  rounds: RoundDraft[];
};

export function createEventDraft(competition: Competition, event?: CompetitionEvent): EventDraft {
  const timeZone = competition.timeZone ?? "Europe/Brussels";
  const primaryTranslation = event?.translations.find(
    (translation) => translation.locale === competition.primaryLocale,
  );
  return {
    disciplineId: event?.disciplineId ?? "",
    kind: event?.kind === "RELAY" ? "RELAY" : "INDIVIDUAL",
    relayLegCount: (event?.relayLegCount ?? 4).toString(),
    resultEntryMode: event?.resultEntryMode ?? "COMPETITION_MANAGER_WEB",
    registerable: event?.registerable ?? true,
    capacity: event?.capacity?.toString() ?? "",
    name: primaryTranslation?.name ?? "",
    description: primaryTranslation?.description ?? "",
    categoryIds: event?.eligibility.map((entry) => entry.athleteCategoryId) ?? [],
    prices: Object.fromEntries(
      competition.pricingTiers.map((tier) => {
        const cents = event?.prices.find((price) => price.pricingTierId === tier.id)?.priceCents;
        return [tier.id, cents === undefined ? "" : (cents / 100).toFixed(2)];
      }),
    ),
    rounds: event?.rounds.length
      ? event.rounds.map((round) => ({
          key: round.id,
          label: round.label,
          scheduledStartAt: instantToZonedInput(round.scheduledStartAt, timeZone),
          startGroups: round.startGroups.map((group) => ({
            key: group.id,
            label: group.label,
            scheduledStartAt: instantToZonedInput(group.scheduledStartAt, timeZone),
          })),
        }))
      : [{ key: crypto.randomUUID(), label: "Final", scheduledStartAt: "", startGroups: [] }],
  };
}

export function canSaveEvent(competition: Competition, draft: EventDraft) {
  return Boolean(
    draft.disciplineId &&
    draft.name.trim() &&
    draft.categoryIds.length > 0 &&
    draft.rounds.length > 0 &&
    draft.rounds.every((round) => round.label.trim() && round.scheduledStartAt) &&
    (!draft.registerable || competition.pricingTiers.every((tier) => draft.prices[tier.id] !== "")),
  );
}

export function buildEventInput(
  competition: Competition,
  draft: EventDraft,
): UpsertCompetitionEvent {
  const timeZone = competition.timeZone ?? "Europe/Brussels";
  return {
    expectedUpdatedAt: new Date(competition.updatedAt),
    disciplineId: draft.disciplineId,
    kind: draft.kind,
    relayLegCount: draft.kind === "RELAY" ? Number(draft.relayLegCount) : null,
    resultEntryMode: draft.resultEntryMode,
    registerable: draft.registerable,
    capacity: draft.capacity ? Number(draft.capacity) : null,
    translations: [
      {
        locale: competition.primaryLocale,
        name: draft.name,
        description: draft.description,
      },
    ],
    athleteCategoryIds: draft.categoryIds,
    prices: draft.registerable
      ? competition.pricingTiers.map((tier) => ({
          pricingTierId: tier.id,
          priceCents: Math.round(Number(draft.prices[tier.id]) * 100),
        }))
      : [],
    rounds: draft.rounds.map((round) => ({
      label: round.label,
      scheduledStartAt: requireValidZonedDate(round.scheduledStartAt, timeZone, "Round start"),
      startGroups: round.startGroups.map((group) => ({
        label: group.label,
        scheduledStartAt: group.scheduledStartAt
          ? requireValidZonedDate(group.scheduledStartAt, timeZone, "Start Group start")
          : null,
      })),
    })),
  };
}
