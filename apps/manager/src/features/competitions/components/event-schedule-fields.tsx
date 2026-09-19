import { Button, Input } from "@repo/ui";
import { Plus, Trash2 } from "lucide-react";

import type { EventDraft, RoundDraft } from "./event-draft";
import { Field } from "./form-field";

export function EventScheduleFields({
  rounds,
  update,
}: {
  rounds: RoundDraft[];
  update: (patch: Partial<EventDraft>) => void;
}) {
  const updateRound = (key: string, patch: Partial<RoundDraft>) =>
    update({
      rounds: rounds.map((round) => (round.key === key ? { ...round, ...patch } : round)),
    });

  return (
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
            update({
              rounds: [
                ...rounds,
                {
                  key: crypto.randomUUID(),
                  label: `Round ${rounds.length + 1}`,
                  scheduledStartAt: "",
                  startGroups: [],
                },
              ],
            })
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
                onChange={(event) => updateRound(round.key, { label: event.target.value })}
                required
              />
            </Field>
            <Field label="Scheduled start" htmlFor={`round-start-${round.key}`}>
              <Input
                id={`round-start-${round.key}`}
                type="datetime-local"
                value={round.scheduledStartAt}
                onChange={(event) =>
                  updateRound(round.key, { scheduledStartAt: event.target.value })
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
              onClick={() => update({ rounds: rounds.filter((item) => item.key !== round.key) })}
            >
              <Trash2 />
            </Button>
          </div>
          <StartGroups round={round} updateRound={updateRound} />
        </div>
      ))}
    </section>
  );
}

function StartGroups({
  round,
  updateRound,
}: {
  round: RoundDraft;
  updateRound: (key: string, patch: Partial<RoundDraft>) => void;
}) {
  const updateGroups = (startGroups: RoundDraft["startGroups"]) =>
    updateRound(round.key, { startGroups });

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium">Start Groups</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() =>
            updateGroups([
              ...round.startGroups,
              {
                key: crypto.randomUUID(),
                label: `Heat ${round.startGroups.length + 1}`,
                scheduledStartAt: round.scheduledStartAt,
              },
            ])
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
            onChange={(event) =>
              updateGroups(
                round.startGroups.map((item) =>
                  item.key === group.key ? { ...item, label: event.target.value } : item,
                ),
              )
            }
          />
          <Input
            aria-label="Start Group scheduled start"
            type="datetime-local"
            value={group.scheduledStartAt}
            onChange={(event) =>
              updateGroups(
                round.startGroups.map((item) =>
                  item.key === group.key ? { ...item, scheduledStartAt: event.target.value } : item,
                ),
              )
            }
          />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Remove Start Group"
            onClick={() => updateGroups(round.startGroups.filter((item) => item.key !== group.key))}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
    </div>
  );
}
