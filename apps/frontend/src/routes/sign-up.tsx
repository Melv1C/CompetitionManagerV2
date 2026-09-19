import { AuthShell, SignUpForm } from "@repo/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { signUp } from "@/lib/auth-client";

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();

  const handleSubmit = async (name: string, email: string, password: string) => {
    const result = await signUp.email({ name, email, password });
    if (result.error) {
      throw new Error(result.error.message ?? "We couldn't create your account.");
    }
    await navigate({ to: "/" });
  };

  return (
    <AuthShell
      eyebrow="New competitor"
      title="Get ready before the first call."
      description="Create one account for your competition entries, schedules, and results."
    >
      <SignUpForm onSubmit={handleSubmit} onLogin={() => navigate({ to: "/login" })} />
    </AuthShell>
  );
}
