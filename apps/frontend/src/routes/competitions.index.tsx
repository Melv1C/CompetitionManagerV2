import { createFileRoute } from "@tanstack/react-router";

import { CompetitionsPage } from "@/components/frontend-prototype";

export const Route = createFileRoute("/competitions/")({ component: CompetitionsPage });
