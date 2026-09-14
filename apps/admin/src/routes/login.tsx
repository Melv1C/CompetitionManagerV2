import { LoginForm } from "@repo/ui";
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
      throw new Error(result.error.message);
    }
    navigate({ to: "/" });
  };

  // const handleProviderLogin = async (provider: LoginProvider) => {
  //   await signIn.social({ provider });
  // };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm
        title="Admin Login"
        description="Sign in to access the admin dashboard"
        onSubmit={handleSubmit}
        showForgotPassword={false}
        showSignUp={false}
      />
    </div>
  );
}
