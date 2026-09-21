import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
} from "@repo/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Plus } from "lucide-react";

import { useCompetitions } from "@/features/competitions";

export const Route = createFileRoute("/organizations/$organizationId/competitions/")({
  component: CompetitionsPage,
});

function CompetitionsPage() {
  const { organizationId } = Route.useParams();
  const competitions = useCompetitions(organizationId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 p-5 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-cyan-800 uppercase">
            Meet calendar
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Competitions</h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm">
            Build the event programme, registration rules, Venue, schedule, and prices before
            publishing.
          </p>
        </div>
        {competitions.isSuccess ? (
          <Button
            render={
              <Link
                to="/organizations/$organizationId/competitions/new"
                params={{ organizationId }}
              />
            }
          >
            <Plus /> New Competition
          </Button>
        ) : null}
      </div>

      {competitions.isPending ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : competitions.isError ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Competitions could not be loaded</CardTitle>
            <CardDescription>{competitions.error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => void competitions.refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : competitions.data.length === 0 ? (
        <Empty className="bg-background/80 min-h-80 border">
          <EmptyHeader>
            <CalendarDays className="text-muted-foreground size-8" />
            <EmptyTitle>No Competitions yet</EmptyTitle>
            <EmptyDescription>
              Start a Draft and work through each setup section at your own pace.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              render={
                <Link
                  to="/organizations/$organizationId/competitions/new"
                  params={{ organizationId }}
                />
              }
            >
              <Plus /> Create the first Competition
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {competitions.data.map((competition) => (
            <Card
              key={competition.id}
              className="group bg-background/90 transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{competition.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {competition.startsAt
                        ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                            new Date(competition.startsAt),
                          )
                        : "Dates not set"}
                    </CardDescription>
                  </div>
                  <Badge variant={competition.lifecycleState === "DRAFT" ? "secondary" : "default"}>
                    {titleCase(competition.lifecycleState)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  {competition.eventCount} {competition.eventCount === 1 ? "Event" : "Events"}
                </p>
                <Button
                  variant="ghost"
                  render={
                    <Link
                      to="/organizations/$organizationId/competitions/$competitionId"
                      params={{ organizationId, competitionId: competition.id }}
                    />
                  }
                >
                  Open setup{" "}
                  <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}
