import { createFileRoute } from "@tanstack/react-router";

import { AthleteCsvImport } from "@/features/athletes";

export const Route = createFileRoute("/athletes")({ component: AthleteCsvImport });
