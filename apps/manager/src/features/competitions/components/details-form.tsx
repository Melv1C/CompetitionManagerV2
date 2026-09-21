import { Button } from "@repo/ui";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  useSaveCompetitionDetails,
  type Competition,
  type CompetitionCatalog,
} from "@/features/competitions";

import { ContactSection, VenueSection } from "./details-contact-venue";
import { buildDetailsInput, createDetailsDraft, type DetailsDraft } from "./details-draft";
import { IdentitySection, ScheduleSection } from "./details-identity-schedule";
import { ClubEligibilitySection, OneDayAthletesSection } from "./details-registration";

export function CompetitionDetailsForm({
  competition,
  catalog,
  disabled,
}: {
  competition: Competition;
  catalog: CompetitionCatalog;
  disabled: boolean;
}) {
  const save = useSaveCompetitionDetails(competition.organizationId, competition.id);
  const [dirty, setDirty] = useState(false);
  const [draft, setDraft] = useState(() => createDetailsDraft(competition));

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (patch: Partial<DetailsDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setDirty(true);
  };

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        try {
          await save.mutateAsync(buildDetailsInput(competition, draft));
          setDirty(false);
          toast.success("Details saved");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Details could not be saved");
        }
      }}
    >
      <IdentitySection
        competition={competition}
        draft={draft}
        disabled={disabled}
        update={update}
      />
      <ScheduleSection draft={draft} disabled={disabled} update={update} />
      <ContactSection draft={draft} disabled={disabled} update={update} />
      <VenueSection draft={draft} disabled={disabled} update={update} />
      <OneDayAthletesSection draft={draft} disabled={disabled} update={update} />
      <ClubEligibilitySection catalog={catalog} draft={draft} disabled={disabled} update={update} />

      {!disabled ? (
        <div className="bg-background/95 sticky bottom-3 flex items-center justify-end gap-3 rounded-xl border p-3 shadow-lg backdrop-blur">
          <span className="text-muted-foreground mr-auto text-xs">
            {dirty ? "Unsaved changes" : "All details saved"}
          </span>
          <Button type="submit" disabled={!dirty || save.isPending}>
            <Save /> {save.isPending ? "Saving…" : "Save details"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
