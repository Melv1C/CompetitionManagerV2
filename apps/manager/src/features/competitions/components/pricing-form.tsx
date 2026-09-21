import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
} from "@repo/ui";
import { Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  useSaveCompetitionPricing,
  type Competition,
  type CompetitionCatalog,
} from "@/features/competitions";

type TierDraft = { key: string; id?: string; name: string; isDefault: boolean; clubIds: string[] };

export function CompetitionPricingForm({
  competition,
  catalog,
  disabled,
}: {
  competition: Competition;
  catalog: CompetitionCatalog;
  disabled: boolean;
}) {
  const save = useSaveCompetitionPricing(competition.organizationId, competition.id);
  const [dirty, setDirty] = useState(false);
  const [tiers, setTiers] = useState<TierDraft[]>(() =>
    competition.pricingTiers.map((tier) => ({
      key: tier.id,
      id: tier.id,
      name: tier.name,
      isDefault: tier.isDefault,
      clubIds: tier.clubAssignments.map((assignment) => assignment.clubId),
    })),
  );

  const updateTier = (key: string, update: Partial<TierDraft>) => {
    setTiers((current) =>
      current.map((tier) => (tier.key === key ? { ...tier, ...update } : tier)),
    );
    setDirty(true);
  };

  const assignClub = (tierKey: string, clubId: string, checked: boolean) => {
    setTiers((current) =>
      current.map((tier) => ({
        ...tier,
        clubIds:
          tier.key === tierKey && checked
            ? [...tier.clubIds.filter((id) => id !== clubId), clubId]
            : tier.clubIds.filter((id) => id !== clubId),
      })),
    );
    setDirty(true);
  };

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        try {
          await save.mutateAsync({
            expectedUpdatedAt: new Date(competition.updatedAt),
            tiers: tiers.map(({ id, name, isDefault, clubIds }) => ({
              id,
              name,
              isDefault,
              clubIds,
            })),
          });
          setDirty(false);
          toast.success("Pricing Tiers saved");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Pricing could not be saved");
        }
      }}
    >
      <Card className="bg-background/95">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Pricing Tiers</CardTitle>
            <CardDescription className="mt-1">
              Every registerable Event receives an explicit price for each tier. Unassigned Clubs
              use the default tier.
            </CardDescription>
          </div>
          {!disabled ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTiers((current) => [
                  ...current,
                  {
                    key: crypto.randomUUID(),
                    name: `Club tier ${current.length}`,
                    isDefault: false,
                    clubIds: [],
                  },
                ]);
                setDirty(true);
              }}
            >
              <Plus /> Add tier
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {tiers.map((tier) => (
            <div key={tier.key} className="rounded-xl border bg-white p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`tier-${tier.key}`}>
                    {tier.isDefault ? "Default tier name" : "Tier name"}
                  </Label>
                  <Input
                    id={`tier-${tier.key}`}
                    value={tier.name}
                    disabled={disabled}
                    onChange={(event) => updateTier(tier.key, { name: event.target.value })}
                    required
                  />
                </div>
                {tier.isDefault ? (
                  <span className="mb-2 rounded-full bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-900">
                    Default
                  </span>
                ) : !disabled ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ${tier.name}`}
                    onClick={() => {
                      setTiers((current) => current.filter((item) => item.key !== tier.key));
                      setDirty(true);
                    }}
                  >
                    <Trash2 />
                  </Button>
                ) : null}
              </div>
              {!tier.isDefault ? (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium">Assigned Clubs</p>
                  {catalog.clubs.length ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {catalog.clubs.map((club) => (
                        <label
                          key={club.id}
                          className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                        >
                          <Checkbox
                            checked={tier.clubIds.includes(club.id)}
                            disabled={disabled}
                            onCheckedChange={(checked) => assignClub(tier.key, club.id, checked)}
                          />
                          <span>{club.name}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No Clubs are available.</p>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
      {!disabled ? (
        <div className="bg-background/95 sticky bottom-3 flex items-center justify-end gap-3 rounded-xl border p-3 shadow-lg backdrop-blur">
          <span className="text-muted-foreground mr-auto text-xs">
            {dirty ? "Unsaved pricing changes" : "All Pricing Tiers saved"}
          </span>
          <Button
            type="submit"
            disabled={!dirty || save.isPending || tiers.some((tier) => !tier.name.trim())}
          >
            <Save /> {save.isPending ? "Saving…" : "Save pricing"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
