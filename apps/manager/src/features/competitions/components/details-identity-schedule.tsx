import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from "@repo/ui";

import type { Competition } from "@/features/competitions";

import { competitionLocales, type DetailsDraft, localeLabels } from "./details-draft";
import { DateField, Field } from "./form-field";

type Props = {
  competition: Competition;
  draft: DetailsDraft;
  disabled: boolean;
  update: (patch: Partial<DetailsDraft>) => void;
};

export function IdentitySection({ competition, draft, disabled, update }: Props) {
  return (
    <Card className="bg-background/95">
      <CardHeader>
        <CardTitle>Identity and translations</CardTitle>
        <CardDescription>
          {localeLabels[competition.primaryLocale]} is the permanent primary locale. Other
          translations are optional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {competitionLocales.map((locale) => (
          <div key={locale} className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">{localeLabels[locale]}</p>
              {locale === competition.primaryLocale ? (
                <span className="text-xs font-medium text-cyan-800">Primary</span>
              ) : null}
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor={`name-${locale}`}>Name</Label>
                <Input
                  id={`name-${locale}`}
                  value={draft.translations[locale].name}
                  required={locale === competition.primaryLocale}
                  disabled={disabled}
                  onChange={(event) =>
                    update({
                      translations: {
                        ...draft.translations,
                        [locale]: {
                          ...draft.translations[locale],
                          name: event.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`description-${locale}`}>Description</Label>
                <Textarea
                  id={`description-${locale}`}
                  value={draft.translations[locale].description}
                  disabled={disabled}
                  onChange={(event) =>
                    update({
                      translations: {
                        ...draft.translations,
                        [locale]: {
                          ...draft.translations[locale],
                          description: event.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ScheduleSection({ draft, disabled, update }: Omit<Props, "competition">) {
  return (
    <Card className="bg-background/95">
      <CardHeader>
        <CardTitle>Competition and registration schedule</CardTitle>
        <CardDescription>
          Times are entered and displayed in the selected IANA time zone.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2">
        <Field label="Time zone" htmlFor="time-zone">
          <Input
            id="time-zone"
            list="time-zone-options"
            value={draft.timeZone}
            disabled={disabled}
            onChange={(event) => update({ timeZone: event.target.value })}
            required
          />
          <datalist id="time-zone-options">
            <option value="Europe/Brussels" />
            <option value="Europe/Amsterdam" />
            <option value="Europe/Paris" />
            <option value="UTC" />
          </datalist>
        </Field>
        <div />
        <DateField
          id="starts-at"
          label="Competition starts"
          value={draft.startsAt}
          onChange={(startsAt) => update({ startsAt })}
          disabled={disabled}
        />
        <DateField
          id="ends-at"
          label="Competition ends"
          value={draft.endsAt}
          onChange={(endsAt) => update({ endsAt })}
          disabled={disabled}
        />
        <DateField
          id="registration-opens"
          label="Registration opens"
          value={draft.registrationOpensAt}
          onChange={(registrationOpensAt) => update({ registrationOpensAt })}
          disabled={disabled}
        />
        <DateField
          id="registration-closes"
          label="Registration closes"
          value={draft.registrationClosesAt}
          onChange={(registrationClosesAt) => update({ registrationClosesAt })}
          disabled={disabled}
        />
        <Field label="Maximum Events per Athlete" htmlFor="max-entries">
          <Input
            id="max-entries"
            type="number"
            min="1"
            value={draft.maxEntries}
            disabled={disabled}
            onChange={(event) => update({ maxEntries: event.target.value })}
            placeholder="Unlimited"
          />
        </Field>
        <Field label="Checkout reservation, minutes" htmlFor="reservation-minutes">
          <Input
            id="reservation-minutes"
            type="number"
            min="1"
            value={draft.reservationMinutes}
            disabled={disabled}
            onChange={(event) => update({ reservationMinutes: event.target.value })}
            required
          />
        </Field>
        <Field label="Settlement delay, days" htmlFor="settlement-days">
          <Input
            id="settlement-days"
            type="number"
            min="0"
            value={draft.settlementDays}
            disabled={disabled}
            onChange={(event) => update({ settlementDays: event.target.value })}
            required
          />
        </Field>
      </CardContent>
    </Card>
  );
}
