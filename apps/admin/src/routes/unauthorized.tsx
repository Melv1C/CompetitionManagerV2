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
      eyebrow="Platform administration"
      title="Keep every competition running smoothly."
      description="Admin access is reserved for the people who maintain the platform."
    >
      <AccessDeniedCard
        eyebrow="Admin access"
        title="This account is not an admin"
        description="Sign in with an admin account, or return to the competition frontend."
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
