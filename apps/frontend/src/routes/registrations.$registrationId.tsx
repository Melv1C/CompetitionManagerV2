import { createFileRoute } from "@tanstack/react-router";

import { RegistrationDetailPage } from "@/components/frontend-prototype";

export const Route = createFileRoute("/registrations/$registrationId")({
  component: RegistrationDetailPage,
});
