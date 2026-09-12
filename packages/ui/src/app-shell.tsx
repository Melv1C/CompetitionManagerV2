import { createSessionClient, fetchHealth } from "@competition-manager/api-client";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components";

export type AppShellProps = {
  surface: "frontend" | "manager" | "admin";
  backendUrl: string;
};

type BackendStatus = "checking" | "ready" | "unavailable";

function formText(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === "string" ? value : "";
}

export function AppShell({ surface, backendUrl }: AppShellProps): ReactElement {
  const [status, setStatus] = useState<BackendStatus>("checking");
  const [session, setSession] =
    useState<Awaited<ReturnType<ReturnType<typeof createSessionClient>["getSession"]>>>(null);
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-up");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authPending, setAuthPending] = useState(false);
  const [managerAccess, setManagerAccess] = useState<boolean | null>(null);
  const authClient = useMemo(() => createSessionClient(backendUrl), [backendUrl]);

  const checkBackend = useCallback(() => {
    setStatus("checking");
    void fetchHealth(backendUrl)
      .then(({ ready }) => setStatus(ready.status === "ready" ? "ready" : "unavailable"))
      .catch(() => setStatus("unavailable"));
  }, [backendUrl]);

  useEffect(() => {
    let active = true;
    void authClient
      .getSession()
      .then((nextSession) => {
        if (active) {
          setSession(nextSession);
        }
      })
      .catch(() => {
        if (active) {
          setSession(null);
        }
      });
    return () => {
      active = false;
    };
  }, [authClient]);

  useEffect(() => {
    if (surface !== "manager" || !session) {
      setManagerAccess(null);
      return;
    }
    let active = true;
    void authClient
      .getManagerAccess()
      .then((allowed) => {
        if (active) setManagerAccess(allowed);
      })
      .catch(() => {
        if (active) setManagerAccess(false);
      });
    return () => {
      active = false;
    };
  }, [authClient, session, surface]);

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setAuthError(null);
    setAuthNotice(null);
    setAuthPending(true);
    const form = new FormData(event.currentTarget);
    const email = formText(form, "email");
    const password = formText(form, "password");

    try {
      const nextSession =
        authMode === "sign-up"
          ? await authClient.signUp({
              name: formText(form, "name"),
              email,
              password,
            })
          : await authClient.signIn({ email, password });
      setSession(nextSession);
      event.currentTarget.reset();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication request failed");
    } finally {
      setAuthPending(false);
    }
  }

  async function handleSignOut(): Promise<void> {
    setAuthPending(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      await authClient.signOut();
      setSession(null);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Sign out failed");
    } finally {
      setAuthPending(false);
    }
  }

  async function handleResendVerification(): Promise<void> {
    setAuthPending(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      await authClient.sendVerificationEmail();
      setAuthNotice("Verification email sent. Check your inbox to continue.");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Could not send verification email");
    } finally {
      setAuthPending(false);
    }
  }

  useEffect(() => {
    let active = true;
    void fetchHealth(backendUrl)
      .then(({ ready }) => {
        if (active) {
          setStatus(ready.status === "ready" ? "ready" : "unavailable");
        }
      })
      .catch(() => {
        if (active) {
          setStatus("unavailable");
        }
      });
    return () => {
      active = false;
    };
  }, [backendUrl]);

  const statusLabel =
    status === "checking" ? "Checking" : status === "ready" ? "Ready" : "Unavailable";

  return (
    <main className="bg-background flex min-h-screen items-center px-6 py-12">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader className="gap-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
              Competition Manager
            </p>
            <Badge variant={status === "ready" ? "default" : "secondary"}>{statusLabel}</Badge>
          </div>
          <CardTitle className="max-w-xl text-4xl leading-tight sm:text-6xl">
            {surface === "frontend" ? "Public competition access" : `${surface} application`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground max-w-xl text-lg leading-8">
            This application uses the shared backend contract and authenticated session boundary.
          </p>
          <Button variant="outline" onClick={checkBackend} disabled={status === "checking"}>
            Check backend readiness
          </Button>
          {session ? (
            <section
              className="border-border bg-secondary/40 space-y-4 rounded-lg border p-4"
              aria-label="Authenticated session"
            >
              <div>
                <p className="text-sm font-semibold">Signed in as {session.user.name}</p>
                <p className="text-muted-foreground text-sm">{session.user.email}</p>
              </div>
              {!session.user.emailVerified && (
                <div className="space-y-3" aria-label="Pending email verification">
                  <p className="text-muted-foreground text-sm">
                    Check your inbox for a verification link. Sensitive actions stay locked until
                    your email is verified.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => void handleResendVerification()}
                    disabled={authPending}
                  >
                    Resend verification email
                  </Button>
                </div>
              )}
              {authNotice && (
                <p className="text-sm" role="status">
                  {authNotice}
                </p>
              )}
              {surface === "manager" && managerAccess && (
                <div aria-label="Manager tools" className="border-border rounded-md border p-3">
                  <p className="font-semibold">Manager tools</p>
                  <p className="text-muted-foreground text-sm">
                    Your verified session can enter Organization tools.
                  </p>
                </div>
              )}
              <Button variant="outline" onClick={handleSignOut} disabled={authPending}>
                Sign out
              </Button>
            </section>
          ) : (
            <section
              className="border-border space-y-4 rounded-lg border p-4"
              aria-label="Authentication"
            >
              <div>
                <h2 className="text-xl font-semibold">
                  {authMode === "sign-up" ? "Create your account" : "Sign in"}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {authMode === "sign-up"
                    ? "Start with an email and password."
                    : "Use your Competition Manager credentials."}
                </p>
              </div>
              <form className="space-y-3" onSubmit={(event) => void handleAuthSubmit(event)}>
                {authMode === "sign-up" && (
                  <label className="block space-y-1 text-sm font-medium">
                    Name
                    <input
                      className="border-input bg-background w-full rounded-md border px-3 py-2"
                      name="name"
                      required
                    />
                  </label>
                )}
                <label className="block space-y-1 text-sm font-medium">
                  Email
                  <input
                    className="border-input bg-background w-full rounded-md border px-3 py-2"
                    name="email"
                    type="email"
                    required
                  />
                </label>
                <label className="block space-y-1 text-sm font-medium">
                  Password
                  <input
                    className="border-input bg-background w-full rounded-md border px-3 py-2"
                    name="password"
                    type="password"
                    minLength={8}
                    required
                  />
                </label>
                {authError && (
                  <p className="text-destructive text-sm" role="alert">
                    {authError}
                  </p>
                )}
                <Button type="submit" disabled={authPending}>
                  {authMode === "sign-up" ? "Create account" : "Sign in"}
                </Button>
              </form>
              <button
                className="text-primary text-sm underline underline-offset-4"
                type="button"
                onClick={() => {
                  setAuthError(null);
                  setAuthMode((mode) => (mode === "sign-up" ? "sign-in" : "sign-up"));
                }}
              >
                {authMode === "sign-up"
                  ? "Already have an account? Sign in"
                  : "Need an account? Create one"}
              </button>
            </section>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
