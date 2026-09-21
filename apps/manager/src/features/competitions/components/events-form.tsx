import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
} from "@repo/ui";
import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  useDeleteCompetitionEvent,
  type Competition,
  type CompetitionCatalog,
  type CompetitionEvent,
} from "@/features/competitions";

import { EventDialog } from "./event-dialog";

export function CompetitionEvents({
  competition,
  catalog,
  disabled,
}: {
  competition: Competition;
  catalog: CompetitionCatalog;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState<CompetitionEvent | "new" | null>(null);
  const remove = useDeleteCompetitionEvent(competition.organizationId, competition.id);
  const primaryName = (event: CompetitionEvent) =>
    event.translations.find((translation) => translation.locale === competition.primaryLocale)
      ?.name ?? event.discipline.code;

  return (
    <Card className="bg-background/95">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Events and schedule</CardTitle>
          <CardDescription className="mt-1">
            Configure eligibility, capacity, prices, Rounds, and optional Start Groups.
          </CardDescription>
        </div>
        {!disabled ? (
          <Button onClick={() => setEditing("new")}>
            <Plus /> Add Event
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {competition.events.length === 0 ? (
          <EmptyEvents />
        ) : (
          <div className="divide-y rounded-xl border">
            {competition.events.map((event) => (
              <div key={event.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{primaryName(event)}</p>
                    <Badge variant="outline">
                      {event.kind === "RELAY"
                        ? `${event.relayLegCount} legs`
                        : event.kind === "COMBINED"
                          ? "Combined"
                          : "Individual"}
                    </Badge>
                    {!event.registerable ? (
                      <Badge variant="secondary">Not registerable</Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {event.rounds.length} {event.rounds.length === 1 ? "Round" : "Rounds"} ·{" "}
                    {event.eligibility.length} eligible{" "}
                    {event.eligibility.length === 1 ? "category" : "categories"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled || event.kind === "COMBINED"}
                    onClick={() => setEditing(event)}
                  >
                    <Pencil /> Edit
                  </Button>
                  {!disabled ? (
                    <DeleteEventButton
                      event={event}
                      name={primaryName(event)}
                      pending={remove.isPending}
                      onDelete={() =>
                        remove.mutateAsync({
                          eventId: event.id,
                          expectedUpdatedAt: competition.updatedAt,
                        })
                      }
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        {editing ? (
          <EventDialog
            key={editing === "new" ? "new" : editing.id}
            competition={competition}
            catalog={catalog}
            event={editing === "new" ? undefined : editing}
            onClose={() => setEditing(null)}
          />
        ) : null}
      </Dialog>
    </Card>
  );
}

function EmptyEvents() {
  return (
    <div className="grid min-h-48 place-items-center rounded-xl border border-dashed text-center">
      <div>
        <CalendarClock className="text-muted-foreground mx-auto mb-3 size-7" />
        <p className="font-medium">No Competition Events</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Add the first Event and schedule its opening Round.
        </p>
      </div>
    </div>
  );
}

function DeleteEventButton({
  event,
  name,
  pending,
  onDelete,
}: {
  event: CompetitionEvent;
  name: string;
  pending: boolean;
  onDelete: () => Promise<unknown>;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Delete ${name}`} />}
      >
        <Trash2 />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this Event?</AlertDialogTitle>
          <AlertDialogDescription>
            The {event.kind === "COMBINED" ? "Combined Event" : "Event"} schedule and prices will
            also be removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={async () => {
              try {
                await onDelete();
                toast.success("Event deleted");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Event could not be deleted");
              }
            }}
          >
            Delete Event
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
