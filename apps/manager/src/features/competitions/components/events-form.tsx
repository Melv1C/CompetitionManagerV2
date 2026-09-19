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
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
  Textarea,
} from "@repo/ui";
import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  useDeleteCompetitionEvent,
  useSaveCompetitionEvent,
  type Competition,
  type CompetitionCatalog,
  type CompetitionEvent,
} from "@/features/competitions";
import { instantToZonedInput, requireValidZonedDate } from "@/features/competitions/date-time";

type RoundDraft = {
  key: string;
  label: string;
  scheduledStartAt: string;
  startGroups: Array<{ key: string; label: string; scheduledStartAt: string }>;
};

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
          <div className="grid min-h-48 place-items-center rounded-xl border border-dashed text-center">
            <div>
              <CalendarClock className="text-muted-foreground mx-auto mb-3 size-7" />
              <p className="font-medium">No Competition Events</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Add the first Event and schedule its opening Round.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y rounded-xl border">
            {competition.events.map((event) => (
              <div key={event.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{primaryName(event)}</p>
                    <Badge variant="outline">
                      {event.kind === "RELAY" ? `${event.relayLegCount} legs` : "Individual"}
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
                    disabled={disabled}
                    onClick={() => setEditing(event)}
                  >
                    <Pencil /> Edit
                  </Button>
                  {!disabled ? (
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${primaryName(event)}`}
                          />
                        }
                      >
                        <Trash2 />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this Event?</AlertDialogTitle>
                          <AlertDialogDescription>
                            The Event schedule and prices will also be removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            disabled={remove.isPending}
                            onClick={async () => {
                              try {
                                await remove.mutateAsync({
                                  eventId: event.id,
                                  expectedUpdatedAt: competition.updatedAt,
                                });
                                toast.success("Event deleted");
                              } catch (error) {
                                toast.error(
                                  error instanceof Error
                                    ? error.message
                                    : "Event could not be deleted",
                                );
                              }
                            }}
                          >
                            Delete Event
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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

function EventDialog({
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
  const timeZone = competition.timeZone ?? "Europe/Brussels";
  const primaryTranslation = event?.translations.find(
    (translation) => translation.locale === competition.primaryLocale,
  );
  const [disciplineId, setDisciplineId] = useState(event?.disciplineId ?? "");
  const [kind, setKind] = useState<"INDIVIDUAL" | "RELAY">(event?.kind ?? "INDIVIDUAL");
  const [relayLegCount, setRelayLegCount] = useState((event?.relayLegCount ?? 4).toString());
  const [resultEntryMode, setResultEntryMode] = useState<
    "ATHLETICS_MANAGER" | "COMPETITION_MANAGER_WEB"
  >(event?.resultEntryMode ?? "COMPETITION_MANAGER_WEB");
  const [registerable, setRegisterable] = useState(event?.registerable ?? true);
  const [capacity, setCapacity] = useState(event?.capacity?.toString() ?? "");
  const [name, setName] = useState(primaryTranslation?.name ?? "");
  const [description, setDescription] = useState(primaryTranslation?.description ?? "");
  const [categoryIds, setCategoryIds] = useState(
    event?.eligibility.map((entry) => entry.athleteCategoryId) ?? [],
  );
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      competition.pricingTiers.map((tier) => {
        const cents = event?.prices.find((price) => price.pricingTierId === tier.id)?.priceCents;
        return [tier.id, cents === undefined ? "" : (cents / 100).toFixed(2)];
      }),
    ),
  );
  const [rounds, setRounds] = useState<RoundDraft[]>(() =>
    event?.rounds.length
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
  );

  const updateRound = (key: string, update: Partial<RoundDraft>) =>
    setRounds((current) =>
      current.map((round) => (round.key === key ? { ...round, ...update } : round)),
    );

  const canSave =
    disciplineId &&
    name.trim() &&
    categoryIds.length > 0 &&
    rounds.length > 0 &&
    rounds.every((round) => round.label.trim() && round.scheduledStartAt) &&
    (!registerable || competition.pricingTiers.every((tier) => prices[tier.id] !== ""));

  return (
    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{event ? "Edit Competition Event" : "Add Competition Event"}</DialogTitle>
        <DialogDescription>Prices use euros. Times use {timeZone}.</DialogDescription>
      </DialogHeader>
      <form
        id="event-form"
        className="space-y-6"
        onSubmit={async (formEvent) => {
          formEvent.preventDefault();
          try {
            await save.mutateAsync({
              expectedUpdatedAt: new Date(competition.updatedAt),
              disciplineId,
              kind,
              relayLegCount: kind === "RELAY" ? Number(relayLegCount) : null,
              resultEntryMode,
              registerable,
              capacity: capacity ? Number(capacity) : null,
              translations: [{ locale: competition.primaryLocale, name, description }],
              athleteCategoryIds: categoryIds,
              prices: registerable
                ? competition.pricingTiers.map((tier) => ({
                    pricingTierId: tier.id,
                    priceCents: Math.round(Number(prices[tier.id]) * 100),
                  }))
                : [],
              rounds: rounds.map((round) => ({
                label: round.label,
                scheduledStartAt: round.scheduledStartAt
                  ? requireValidZonedDate(round.scheduledStartAt, timeZone, "Round start")
                  : null,
                startGroups: round.startGroups.map((group) => ({
                  label: group.label,
                  scheduledStartAt: group.scheduledStartAt
                    ? requireValidZonedDate(group.scheduledStartAt, timeZone, "Start Group start")
                    : null,
                })),
              })),
            });
            toast.success(event ? "Event saved" : "Event added");
            onClose();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Event could not be saved");
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Discipline" htmlFor="event-discipline">
            <select
              id="event-discipline"
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={disciplineId}
              onChange={(changeEvent) => setDisciplineId(changeEvent.target.value)}
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
              value={kind}
              onChange={(changeEvent) => setKind(changeEvent.target.value as typeof kind)}
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="RELAY">Relay</option>
            </select>
          </Field>
          {kind === "RELAY" ? (
            <Field label="Relay legs" htmlFor="relay-legs">
              <Input
                id="relay-legs"
                type="number"
                min="1"
                max="20"
                value={relayLegCount}
                onChange={(changeEvent) => setRelayLegCount(changeEvent.target.value)}
                required
              />
            </Field>
          ) : null}
          <Field label="Result entry" htmlFor="result-entry-mode">
            <select
              id="result-entry-mode"
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={resultEntryMode}
              onChange={(changeEvent) =>
                setResultEntryMode(changeEvent.target.value as typeof resultEntryMode)
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
              value={capacity}
              onChange={(changeEvent) => setCapacity(changeEvent.target.value)}
              placeholder="Unlimited"
            />
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Open for registration</p>
            <p className="text-muted-foreground text-xs">
              Schedule-only Events do not need prices.
            </p>
          </div>
          <Switch checked={registerable} onCheckedChange={setRegisterable} />
        </div>
        <div className="grid gap-4">
          <Field label={`Name · ${competition.primaryLocale}`} htmlFor="event-name">
            <Input
              id="event-name"
              value={name}
              onChange={(changeEvent) => setName(changeEvent.target.value)}
              required
            />
          </Field>
          <Field label="Description" htmlFor="event-description">
            <Textarea
              id="event-description"
              value={description}
              onChange={(changeEvent) => setDescription(changeEvent.target.value)}
            />
          </Field>
        </div>
        <section>
          <h3 className="mb-3 text-sm font-semibold">Eligible Athlete Categories</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {catalog.categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-3 rounded-lg border p-3 text-sm"
              >
                <Checkbox
                  checked={categoryIds.includes(category.id)}
                  onCheckedChange={(checked) =>
                    setCategoryIds((current) =>
                      checked
                        ? [...current, category.id]
                        : current.filter((id) => id !== category.id),
                    )
                  }
                />
                <span>{translatedName(category, competition.primaryLocale)}</span>
              </label>
            ))}
          </div>
        </section>
        {registerable ? (
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
                    value={prices[tier.id] ?? ""}
                    onChange={(changeEvent) =>
                      setPrices({ ...prices, [tier.id]: changeEvent.target.value })
                    }
                    required
                  />
                </Field>
              ))}
            </div>
          </section>
        ) : null}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Rounds</h3>
              <p className="text-muted-foreground text-xs">Order follows the list below.</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setRounds((current) => [
                  ...current,
                  {
                    key: crypto.randomUUID(),
                    label: `Round ${current.length + 1}`,
                    scheduledStartAt: "",
                    startGroups: [],
                  },
                ])
              }
            >
              <Plus /> Add Round
            </Button>
          </div>
          {rounds.map((round, roundIndex) => (
            <div key={round.key} className="rounded-xl border p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <Field label={`Round ${roundIndex + 1} label`} htmlFor={`round-label-${round.key}`}>
                  <Input
                    id={`round-label-${round.key}`}
                    value={round.label}
                    onChange={(changeEvent) =>
                      updateRound(round.key, { label: changeEvent.target.value })
                    }
                    required
                  />
                </Field>
                <Field label="Scheduled start" htmlFor={`round-start-${round.key}`}>
                  <Input
                    id={`round-start-${round.key}`}
                    type="datetime-local"
                    value={round.scheduledStartAt}
                    onChange={(changeEvent) =>
                      updateRound(round.key, { scheduledStartAt: changeEvent.target.value })
                    }
                    required
                  />
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6"
                  aria-label="Remove Round"
                  disabled={rounds.length === 1}
                  onClick={() =>
                    setRounds((current) => current.filter((item) => item.key !== round.key))
                  }
                >
                  <Trash2 />
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">Start Groups</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      updateRound(round.key, {
                        startGroups: [
                          ...round.startGroups,
                          {
                            key: crypto.randomUUID(),
                            label: `Heat ${round.startGroups.length + 1}`,
                            scheduledStartAt: round.scheduledStartAt,
                          },
                        ],
                      })
                    }
                  >
                    <Plus /> Add group
                  </Button>
                </div>
                {round.startGroups.map((group) => (
                  <div key={group.key} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <Input
                      aria-label="Start Group label"
                      value={group.label}
                      onChange={(changeEvent) =>
                        updateRound(round.key, {
                          startGroups: round.startGroups.map((item) =>
                            item.key === group.key
                              ? { ...item, label: changeEvent.target.value }
                              : item,
                          ),
                        })
                      }
                    />
                    <Input
                      aria-label="Start Group scheduled start"
                      type="datetime-local"
                      value={group.scheduledStartAt}
                      onChange={(changeEvent) =>
                        updateRound(round.key, {
                          startGroups: round.startGroups.map((item) =>
                            item.key === group.key
                              ? { ...item, scheduledStartAt: changeEvent.target.value }
                              : item,
                          ),
                        })
                      }
                    />
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Remove Start Group"
                      onClick={() =>
                        updateRound(round.key, {
                          startGroups: round.startGroups.filter((item) => item.key !== group.key),
                        })
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form="event-form" disabled={!canSave || save.isPending}>
          {save.isPending ? "Saving…" : event ? "Save Event" : "Add Event"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
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
