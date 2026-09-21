import { Checkbox, Input, Switch, Textarea } from "@repo/ui";

import type { Competition, CompetitionCatalog } from "@/features/competitions";

import type { EventDraft } from "./event-draft";
import { Field } from "./form-field";

type Props = {
  competition: Competition;
  catalog: CompetitionCatalog;
  draft: EventDraft;
  update: (patch: Partial<EventDraft>) => void;
};

export function EventDetailsFields({ competition, catalog, draft, update }: Props) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Discipline" htmlFor="event-discipline">
          <select
            id="event-discipline"
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            value={draft.disciplineId}
            onChange={(event) => update({ disciplineId: event.target.value })}
            required
          >
            <option value="">Select a Discipline</option>
            {catalog.disciplines.map((discipline) => (
              <option key={discipline.id} value={discipline.id}>
                {translatedName(discipline, competition.primaryLocale)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Event kind" htmlFor="event-kind">
          <select
            id="event-kind"
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            value={draft.kind}
            onChange={(event) => update({ kind: event.target.value as EventDraft["kind"] })}
          >
            <option value="INDIVIDUAL">Individual</option>
            <option value="RELAY">Relay</option>
          </select>
        </Field>
        {draft.kind === "RELAY" ? (
          <Field label="Relay legs" htmlFor="relay-legs">
            <Input
              id="relay-legs"
              type="number"
              min="1"
              max="20"
              value={draft.relayLegCount}
              onChange={(event) => update({ relayLegCount: event.target.value })}
              required
            />
          </Field>
        ) : null}
        <Field label="Result entry" htmlFor="result-entry-mode">
          <select
            id="result-entry-mode"
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            value={draft.resultEntryMode}
            onChange={(event) =>
              update({ resultEntryMode: event.target.value as EventDraft["resultEntryMode"] })
            }
          >
            <option value="COMPETITION_MANAGER_WEB">Competition Manager Web</option>
            <option value="ATHLETICS_MANAGER">AthleticsManager</option>
          </select>
        </Field>
        <Field label="Capacity" htmlFor="event-capacity">
          <Input
            id="event-capacity"
            type="number"
            min="1"
            value={draft.capacity}
            onChange={(event) => update({ capacity: event.target.value })}
            placeholder="Unlimited"
          />
        </Field>
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Open for registration</p>
          <p className="text-muted-foreground text-xs">Schedule-only Events do not need prices.</p>
        </div>
        <Switch
          checked={draft.registerable}
          onCheckedChange={(registerable) => update({ registerable })}
        />
      </div>
      <div className="grid gap-4">
        <Field label={`Name · ${competition.primaryLocale}`} htmlFor="event-name">
          <Input
            id="event-name"
            value={draft.name}
            onChange={(event) => update({ name: event.target.value })}
            required
          />
        </Field>
        <Field label="Description" htmlFor="event-description">
          <Textarea
            id="event-description"
            value={draft.description}
            onChange={(event) => update({ description: event.target.value })}
          />
        </Field>
      </div>
      <EligibilityAndPrices
        competition={competition}
        catalog={catalog}
        draft={draft}
        update={update}
      />
    </>
  );
}

function EligibilityAndPrices({ competition, catalog, draft, update }: Props) {
  return (
    <>
      <section>
        <h3 className="mb-3 text-sm font-semibold">Eligible Athlete Categories</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {catalog.categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-3 rounded-lg border p-3 text-sm"
            >
              <Checkbox
                checked={draft.categoryIds.includes(category.id)}
                onCheckedChange={(checked) =>
                  update({
                    categoryIds: checked
                      ? [...draft.categoryIds, category.id]
                      : draft.categoryIds.filter((id) => id !== category.id),
                  })
                }
              />
              <span>{translatedName(category, competition.primaryLocale)}</span>
            </label>
          ))}
        </div>
      </section>
      {draft.registerable ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold">Event prices</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {competition.pricingTiers.map((tier) => (
              <Field key={tier.id} label={`${tier.name} price (€)`} htmlFor={`price-${tier.id}`}>
                <Input
                  id={`price-${tier.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.prices[tier.id] ?? ""}
                  onChange={(event) =>
                    update({ prices: { ...draft.prices, [tier.id]: event.target.value } })
                  }
                  required
                />
              </Field>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function translatedName(
  item: { code: string; translations: Array<{ locale: string; name: string }> },
  locale: string,
) {
  return (
    item.translations.find((translation) => translation.locale === locale)?.name ??
    item.translations[0]?.name ??
    item.code
  );
}
