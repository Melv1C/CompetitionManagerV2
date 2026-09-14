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
      eyebrow="Manager desk"
      title="Run the competition from one place."
      description="Sign in with an account that belongs to an organization."
    >
      <LoginForm
        title="Manager login"
        description="Enter the email and password for your organization account."
        onSubmit={handleSubmit}
        showForgotPassword={false}
        showSignUp={false}
      />
    </AuthShell>
  );
}
