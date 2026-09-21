import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Switch,
} from "@repo/ui";

import type { CompetitionCatalog } from "@/features/competitions";

import type { DetailsDraft } from "./details-draft";
import { Field } from "./form-field";

type Props = {
  draft: DetailsDraft;
  disabled: boolean;
  update: (patch: Partial<DetailsDraft>) => void;
};

export function OneDayAthletesSection({ draft, disabled, update }: Props) {
  return (
    <Card className="bg-background/95">
      <CardHeader>
        <CardTitle>One-day Athletes</CardTitle>
        <CardDescription>
          Reserve a Competition-only bib range when one-day registration is allowed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Allow one-day Athlete registration</p>
            <p className="text-muted-foreground text-xs">
              Federated Athletes continue to use their season bib.
            </p>
          </div>
          <Switch
            checked={draft.oneDayEnabled}
            disabled={disabled}
            onCheckedChange={(oneDayEnabled) => update({ oneDayEnabled })}
          />
        </div>
        {draft.oneDayEnabled ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="First bib" htmlFor="bib-start">
              <Input
                id="bib-start"
                type="number"
                min="1"
                value={draft.bibStart}
                disabled={disabled}
                onChange={(event) => update({ bibStart: event.target.value })}
              />
            </Field>
            <Field label="Last bib" htmlFor="bib-end">
              <Input
                id="bib-end"
                type="number"
                min="1"
                value={draft.bibEnd}
                disabled={disabled}
                onChange={(event) => update({ bibEnd: event.target.value })}
              />
            </Field>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ClubEligibilitySection({
  catalog,
  draft,
  disabled,
  update,
}: Props & { catalog: CompetitionCatalog }) {
  const setClub = (clubId: string, checked: boolean) =>
    update({
      clubEligibilityIds: checked
        ? [...draft.clubEligibilityIds, clubId]
        : draft.clubEligibilityIds.filter((id) => id !== clubId),
    });

  return (
    <Card className="bg-background/95">
      <CardHeader>
        <CardTitle>Club eligibility</CardTitle>
        <CardDescription>Leave every Club unchecked to allow all Clubs.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {catalog.clubs.map((club) => (
          <label key={club.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
            <Checkbox
              checked={draft.clubEligibilityIds.includes(club.id)}
              disabled={disabled}
              onCheckedChange={(checked) => setClub(club.id, checked)}
            />
            <span>
              {club.name}
              {club.abbreviation ? ` · ${club.abbreviation}` : ""}
            </span>
          </label>
        ))}
        {catalog.clubs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No Clubs are available in the catalog.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
