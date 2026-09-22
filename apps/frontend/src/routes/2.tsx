import { createFileRoute } from "@tanstack/react-router";

import { CompetitionsPage } from "@/components/frontend-prototype";

export const Route = createFileRoute("/2")({ component: CompetitionsPage });
