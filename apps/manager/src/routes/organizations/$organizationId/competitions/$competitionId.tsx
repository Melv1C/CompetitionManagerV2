import { Card, CardDescription, CardHeader, CardTitle, Skeleton } from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";

import { useCompetition, useCompetitionCatalog } from "@/features/competitions";
import { CompetitionEditor } from "@/features/competitions/components/competition-editor";

export const Route = createFileRoute("/organizations/$organizationId/competitions/$competitionId")({
  component: CompetitionEditorPage,
});

function CompetitionEditorPage() {
  const { organizationId, competitionId } = Route.useParams();
  const competition = useCompetition(organizationId, competitionId);
  const catalog = useCompetitionCatalog(organizationId);

  if (competition.isPending || catalog.isPending) {
    return (
      <div className="mx-auto max-w-[90rem] space-y-5 p-5 md:p-8">
        <Skeleton className="h-20 w-2/3" />
        <div className="grid gap-6 xl:grid-cols-[1fr_21rem]">
          <Skeleton className="h-[40rem]" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (competition.isError || catalog.isError) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Competition setup could not be loaded</CardTitle>
            <CardDescription>
              {competition.error?.message ?? catalog.error?.message}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <CompetitionEditor competition={competition.data} catalog={catalog.data} />;
}
