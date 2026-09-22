import { createFileRoute } from "@tanstack/react-router";

import { ProfilePage } from "@/components/frontend-prototype";

export const Route = createFileRoute("/profile")({ component: ProfilePage });
