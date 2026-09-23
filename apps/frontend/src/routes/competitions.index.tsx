import { createFileRoute } from "@tanstack/react-router";

import { CompetitionsPage } from "@/features/competitions";

export const Route = createFileRoute("/competitions/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" && search.q.trim() ? search.q.trim() : undefined,
    disciplineId:
      typeof search.disciplineId === "string" && search.disciplineId
        ? search.disciplineId
        : undefined,
  }),
  component: CompetitionsPage,
});
