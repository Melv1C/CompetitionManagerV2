import { createFileRoute } from "@tanstack/react-router";

import { RegistrationsPage } from "@/components/frontend-prototype";

export const Route = createFileRoute("/registrations/")({ component: RegistrationsPage });
