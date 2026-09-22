import { createFileRoute } from "@tanstack/react-router";

import { HomePage } from "@/components/frontend-prototype";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <HomePage />;
}
