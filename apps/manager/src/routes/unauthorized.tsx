import { Button } from "@repo/ui";
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
    <main className="flex min-h-screen items-center justify-center bg-[#edf3f7] p-5 text-[#122335]">
      <section className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-[0_24px_80px_rgba(18,54,84,0.12)] ring-1 ring-[#123654]/10 sm:p-10">
        <p className="font-mono text-xs font-semibold tracking-[0.2em] text-[#28688f] uppercase">
          Organization access
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">No organization found</h1>
        <p className="text-muted-foreground mt-3 leading-6">
          Ask an organization owner to invite this account, or sign in with a different one.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleSignOut} className="bg-[#123654] hover:bg-[#1b486c]">
            Sign out
          </Button>
          <Button variant="outline" onClick={() => window.location.assign(ENV.FRONTEND_URL)}>
            Go to frontend
          </Button>
        </div>
      </section>
    </main>
  );
}
