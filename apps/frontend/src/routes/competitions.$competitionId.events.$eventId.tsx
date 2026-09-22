import { createFileRoute } from "@tanstack/react-router";

import { EventDetailPage } from "@/components/frontend-prototype";

export const Route = createFileRoute("/competitions/$competitionId/events/$eventId")({
  component: EventDetailPage,
});
