import { AccessDeniedCard, AuthShell, Button } from "@repo/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ENV } from "varlock/env";

import { signOut } from "@/lib/auth-client";

export const Route = createFileRoute("/unauthorized")({
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: "/login" });
  };

  return (
    <AuthShell
      eyebrow="Organization workspace"
      title="Keep the whole event moving."
      description="Plan competitions, coordinate schedules, and publish results with your organization."
    >
      <AccessDeniedCard
        eyebrow="Organization access"
        title="No organization found"
        description="Ask an organization owner to invite this account, or sign in with a different one."
      >
        <Button className="sm:flex-1" onClick={handleSignOut}>
          Sign out
        </Button>
        <Button
          className="sm:flex-1"
          variant="outline"
          onClick={() => window.location.assign(ENV.FRONTEND_URL)}
        >
          Go to frontend
        </Button>
      </AccessDeniedCard>
    </AuthShell>
  );
}
