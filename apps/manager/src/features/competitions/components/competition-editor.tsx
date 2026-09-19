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
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@repo/ui";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, CircleAlert, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  useDeleteCompetition,
  usePublishCompetition,
  type Competition,
  type CompetitionCatalog,
} from "@/features/competitions";

import { CompetitionDetailsForm } from "./details-form";
import { CompetitionEvents } from "./events-form";
import { CompetitionPricingForm } from "./pricing-form";

export function CompetitionEditor({
  competition,
  catalog,
}: {
  competition: Competition;
  catalog: CompetitionCatalog;
}) {
  const { organizationId, id: competitionId } = competition;
  const navigate = useNavigate();
  const publish = usePublishCompetition(organizationId, competitionId);
  const remove = useDeleteCompetition(organizationId, competitionId);
  const [deleteReason, setDeleteReason] = useState("");
  const primaryName =
    competition.translations.find((translation) => translation.locale === competition.primaryLocale)
      ?.name ?? "Untitled Competition";
  const isDraft = competition.lifecycleState === "DRAFT";

  return (
    <div className="mx-auto w-full max-w-[90rem] p-4 md:p-7">
      <Button
        variant="ghost"
        className="mb-4 -ml-2"
        render={
          <Link to="/organizations/$organizationId/competitions" params={{ organizationId }} />
        }
      >
        <ArrowLeft /> Competitions
      </Button>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-cyan-800 uppercase">
              Competition setup
            </p>
            <Badge variant={isDraft ? "secondary" : "default"}>{competition.lifecycleState}</Badge>
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{primaryName}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {competition.athleticsSeason.code} · primary locale {competition.primaryLocale}
          </p>
        </div>
        {isDraft ? (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="outline" />}>
              <Trash2 /> Delete Draft
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this Draft?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes its Venue, Events, schedule, and pricing. The audit record remains.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Label htmlFor="delete-reason">Reason</Label>
                <Textarea
                  id="delete-reason"
                  value={deleteReason}
                  onChange={(event) => setDeleteReason(event.target.value)}
                  placeholder="Created by mistake"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Draft</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={!deleteReason.trim() || remove.isPending}
                  onClick={async () => {
                    try {
                      await remove.mutateAsync({
                        expectedUpdatedAt: competition.updatedAt,
                        reason: deleteReason,
                      });
                      toast.success("Draft deleted");
                      await navigate({
                        to: "/organizations/$organizationId/competitions",
                        params: { organizationId },
                      });
                    } catch (error) {
                      toast.error(
                        error instanceof Error ? error.message : "Draft could not be deleted",
                      );
                    }
                  }}
                >
                  Delete Draft
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <Tabs defaultValue="details" className="min-w-0">
          <TabsList className="mb-5 grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="events">Events & schedule</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <CompetitionDetailsForm
              key={`details-${competition.updatedAt}`}
              competition={competition}
              catalog={catalog}
              disabled={!isDraft}
            />
          </TabsContent>
          <TabsContent value="pricing">
            <CompetitionPricingForm
              key={`pricing-${competition.updatedAt}`}
              competition={competition}
              catalog={catalog}
              disabled={!isDraft}
            />
          </TabsContent>
          <TabsContent value="events">
            <CompetitionEvents competition={competition} catalog={catalog} disabled={!isDraft} />
          </TabsContent>
        </Tabs>

        <Card className="border-cyan-900/15 bg-white/95 xl:sticky xl:top-5">
          <CardHeader>
            <div className="flex items-center gap-2">
              {competition.readiness.ready ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : (
                <CircleAlert className="size-5 text-amber-600" />
              )}
              <CardTitle>Publication readiness</CardTitle>
            </div>
            <CardDescription>
              {competition.readiness.ready
                ? "This Competition has everything required for publication."
                : `${competition.readiness.missing.length} setup item${competition.readiness.missing.length === 1 ? "" : "s"} remaining.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {competition.readiness.missing.length ? (
              <ol className="space-y-3 border-l border-cyan-900/15 pl-4">
                {competition.readiness.missing.map((item) => (
                  <li key={item} className="text-muted-foreground text-sm leading-snug">
                    {item}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
                Dates, Venue, contact, Events, schedule, eligibility, and prices are complete.
              </div>
            )}
            <Button
              className="w-full bg-cyan-800 hover:bg-cyan-900"
              disabled={!isDraft || !competition.readiness.ready || publish.isPending}
              onClick={async () => {
                try {
                  await publish.mutateAsync({ expectedUpdatedAt: competition.updatedAt });
                  toast.success("Competition published");
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Competition could not be published",
                  );
                }
              }}
            >
              <Send /> {publish.isPending ? "Publishing…" : "Publish Competition"}
            </Button>
            {!isDraft ? (
              <p className="text-muted-foreground text-center text-xs">
                Published setup is read-only in this workflow.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
