import {
  Button,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";

import {
  useSaveCompetitionEvent,
  useCreateOrganizationDiscipline,
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
  const createDiscipline = useCreateOrganizationDiscipline(competition.organizationId);
  const [draft, setDraft] = useState(() => createEventDraft(competition, event));
  const [addingDiscipline, setAddingDiscipline] = useState(false);
  const [disciplineCode, setDisciplineCode] = useState("");
  const [disciplineName, setDisciplineName] = useState("");
  const [disciplineMeasurement, setDisciplineMeasurement] = useState<
    "TIME" | "DISTANCE" | "HEIGHT" | "POINTS"
  >("TIME");
  const [createdDiscipline, setCreatedDiscipline] = useState<
    CompetitionCatalog["disciplines"][number] | null
  >(null);
  const update = (patch: Partial<EventDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const availableCatalog =
    createdDiscipline && !catalog.disciplines.some(({ id }) => id === createdDiscipline.id)
      ? { ...catalog, disciplines: [...catalog.disciplines, createdDiscipline] }
      : catalog;

  return (
    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{event ? "Edit Competition Event" : "Add Competition Event"}</DialogTitle>
        <DialogDescription>
          Prices use euros. Times use {competition.timeZone ?? "Europe/Brussels"}.
        </DialogDescription>
      </DialogHeader>
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setAddingDiscipline((value) => !value)}
        >
          {addingDiscipline ? "Cancel new Discipline" : "Add Organization Discipline"}
        </Button>
        {addingDiscipline ? (
          <form
            className="mt-3 grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
            onSubmit={async (formEvent) => {
              formEvent.preventDefault();
              try {
                const { discipline } = await createDiscipline.mutateAsync({
                  code: disciplineCode.trim().toUpperCase(),
                  measurement: disciplineMeasurement,
                  translations: [
                    {
                      locale: competition.primaryLocale,
                      name: disciplineName.trim(),
                      abbreviation: null,
                    },
                  ],
                });
                setCreatedDiscipline(discipline);
                update({ disciplineId: discipline.id });
                setAddingDiscipline(false);
                toast.success("Organization Discipline added");
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : "Discipline could not be added",
                );
              }
            }}
          >
            <label className="grid gap-1 text-sm">
              Code
              <Input
                value={disciplineCode}
                onChange={(event) => setDisciplineCode(event.target.value)}
                placeholder="80MH-762MM-8H-1200CM-700CM"
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              Name · {competition.primaryLocale}
              <Input
                value={disciplineName}
                onChange={(event) => setDisciplineName(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              Measurement
              <select
                className="border-input bg-background h-9 rounded-md border px-3"
                value={disciplineMeasurement}
                onChange={(event) =>
                  setDisciplineMeasurement(event.target.value as typeof disciplineMeasurement)
                }
              >
                <option value="TIME">Time</option>
                <option value="DISTANCE">Distance</option>
                <option value="HEIGHT">Height</option>
                <option value="POINTS">Points</option>
              </select>
            </label>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={
                  createDiscipline.isPending || !disciplineCode.trim() || !disciplineName.trim()
                }
              >
                Save Discipline
              </Button>
            </div>
            <p className="text-muted-foreground text-xs sm:col-span-2">
              Include equipment weight, hurdle height and spacing in the code and name when they
              differ. Existing Disciplines keep their identity.
            </p>
          </form>
        ) : null}
      </div>
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
          catalog={availableCatalog}
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
