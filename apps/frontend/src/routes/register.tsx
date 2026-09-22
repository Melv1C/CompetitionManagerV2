import { createFileRoute } from "@tanstack/react-router";

import { RegistrationWizardPage } from "@/components/frontend-prototype";

export const Route = createFileRoute("/register")({ component: RegistrationWizardPage });
