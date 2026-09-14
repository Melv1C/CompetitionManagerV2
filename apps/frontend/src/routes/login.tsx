import { AuthShell, LoginForm } from "@repo/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { signIn } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  const handleSubmit = async (email: string, password: string) => {
    const result = await signIn.email({ email, password });
    if (result.error) {
      throw new Error(result.error.message ?? "We couldn't log you in with those details.");
    }
    await navigate({ to: "/" });
  };

  return (
    <AuthShell
      eyebrow="Competition access"
      title="Your competitions, one clear view."
      description="Sign in to return to your competitions, schedules, and results."
    >
      <LoginForm
        title="Welcome back"
        description="Enter the email and password for your account."
        onSubmit={handleSubmit}
        onSignUp={() => navigate({ to: "/sign-up" })}
        showForgotPassword={false}
      />
    </AuthShell>
  );
}
