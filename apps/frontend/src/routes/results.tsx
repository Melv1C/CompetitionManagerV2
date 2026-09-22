import { createFileRoute } from "@tanstack/react-router";

import { ResultsPage } from "@/components/frontend-prototype";

export const Route = createFileRoute("/results")({ component: ResultsPage });
