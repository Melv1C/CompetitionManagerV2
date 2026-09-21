import {
  Button,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";

import {
  useSaveCompetitionEvent,
  type Competition,
  type CompetitionCatalog,
  type CompetitionEvent,
} from "@/features/competitions";

import { EventDetailsFields } from "./event-details-fields";
import { buildEventInput, canSaveEvent, createEventDraft, type EventDraft } from "./event-draft";
import { EventScheduleFields } from "./event-schedule-fields";

export function EventDialog({
  competition,
  catalog,
  event,
  onClose,
}: {
  competition: Competition;
  catalog: CompetitionCatalog;
  event?: CompetitionEvent;
  onClose: () => void;
}) {
  const save = useSaveCompetitionEvent(competition.organizationId, competition.id, event?.id);
  const [draft, setDraft] = useState(() => createEventDraft(competition, event));
  const update = (patch: Partial<EventDraft>) => setDraft((current) => ({ ...current, ...patch }));

  return (
    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{event ? "Edit Competition Event" : "Add Competition Event"}</DialogTitle>
        <DialogDescription>
          Prices use euros. Times use {competition.timeZone ?? "Europe/Brussels"}.
        </DialogDescription>
      </DialogHeader>
      <form
        id="event-form"
        className="space-y-6"
        onSubmit={async (formEvent) => {
          formEvent.preventDefault();
          try {
            await save.mutateAsync(buildEventInput(competition, draft));
            toast.success(event ? "Event saved" : "Event added");
            onClose();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Event could not be saved");
          }
        }}
      >
        <EventDetailsFields
          competition={competition}
          catalog={catalog}
          draft={draft}
          update={update}
        />
        <EventScheduleFields rounds={draft.rounds} update={update} />
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="event-form"
          disabled={!canSaveEvent(competition, draft) || save.isPending}
        >
          {save.isPending ? "Saving…" : event ? "Save Event" : "Add Event"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
