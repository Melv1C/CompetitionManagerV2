import { createFileRoute } from "@tanstack/react-router";

import { CompetitionDetailPage } from "@/components/frontend-prototype";

export const Route = createFileRoute("/competitions/$competitionId/")({
  component: CompetitionDetailPage,
});
