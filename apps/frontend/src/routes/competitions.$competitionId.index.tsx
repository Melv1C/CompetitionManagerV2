import { createFileRoute } from "@tanstack/react-router";

import { CompetitionDetailPage } from "@/features/competitions";

export const Route = createFileRoute("/competitions/$competitionId/")({
  component: CompetitionDetailPage,
});
