import {
  createAdminOrganizationClient,
  createOrganizationClient,
  createSessionClient,
  fetchHealth,
  type EligibleUser,
  type OrganizationResponse,
} from "@competition-manager/api-client";
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
  const [organizations, setOrganizations] = useState<OrganizationResponse[] | null>(null);
  const [activeOrganization, setActiveOrganization] = useState<OrganizationResponse | null>(null);
  const [organizationError, setOrganizationError] = useState<string | null>(null);
  const [organizationPending, setOrganizationPending] = useState(false);
  const [ownerQuery, setOwnerQuery] = useState("");
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [ownerSearchPending, setOwnerSearchPending] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<EligibleUser | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);
  const authClient = useMemo(() => createSessionClient(backendUrl), [backendUrl]);
  const organizationClient = useMemo(() => createOrganizationClient(backendUrl), [backendUrl]);
  const adminOrganizationClient = useMemo(
    () => createAdminOrganizationClient(backendUrl),
    [backendUrl],
  );
  const isPlatformAdmin = (session?.user as { role?: string | null } | undefined)?.role === "admin";

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

  useEffect(() => {
    if (surface !== "manager" || managerAccess !== true) {
      setOrganizations(null);
      setActiveOrganization(null);
      return;
    }
    let active = true;
    void organizationClient
      .listOrganizations()
      .then(({ organizations: nextOrganizations }) => {
        if (!active) return;
        setOrganizations(nextOrganizations);
        const match = window.location.pathname.match(/^\/organizations\/([^/]+)$/);
        const organizationId = match ? decodeURIComponent(match[1]!) : null;
        if (organizationId) {
          void organizationClient
            .getOrganization(organizationId)
            .then((nextOrganization) => {
              if (active) setActiveOrganization(nextOrganization);
            })
            .catch((error: unknown) => {
              if (active) {
                setActiveOrganization(null);
                setOrganizationError(
                  error instanceof Error ? error.message : "Could not load this Organization",
                );
              }
            });
        } else if (nextOrganizations.length > 0) {
          setActiveOrganization(nextOrganizations[0]!);
          window.history.replaceState(
            {},
            "",
            `/organizations/${encodeURIComponent(nextOrganizations[0]!.organization.id)}`,
          );
        } else {
          setActiveOrganization(null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setOrganizations([]);
          setOrganizationError(
            error instanceof Error ? error.message : "Could not load your Organizations",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [managerAccess, organizationClient, surface]);

  useEffect(() => {
    if (surface !== "admin" || !isPlatformAdmin || ownerQuery.trim().length < 2) {
      setEligibleUsers([]);
      setOwnerSearchPending(false);
      return;
    }
    let active = true;
    setOwnerSearchPending(true);
    void adminOrganizationClient
      .searchEligibleUsers(ownerQuery)
      .then(({ users }) => {
        if (active) setEligibleUsers(users);
      })
      .catch((error: unknown) => {
        if (active) {
          setAdminError(error instanceof Error ? error.message : "Could not search users");
        }
      })
      .finally(() => {
        if (active) setOwnerSearchPending(false);
      });
    return () => {
      active = false;
    };
  }, [adminOrganizationClient, isPlatformAdmin, ownerQuery, surface]);

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
      setManagerAccess(null);
      setOrganizations(null);
      setActiveOrganization(null);
      setOrganizationError(null);
      setSelectedOwner(null);
      setOwnerSearchPending(false);
      setOwnerQuery("");
      setEligibleUsers([]);
      setAdminError(null);
      setAdminNotice(null);
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
      setManagerAccess(null);
      setOrganizations(null);
      setActiveOrganization(null);
      setSelectedOwner(null);
      setOwnerSearchPending(false);
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

  async function handleOrganizationSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setAdminError(null);
    setAdminNotice(null);
    if (!selectedOwner) {
      setAdminError("Select an eligible existing user as the Organization owner.");
      return;
    }
    setOrganizationPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const created = await adminOrganizationClient.createOrganization({
        name: formText(form, "organizationName"),
        slug: formText(form, "organizationSlug"),
        ownerUserId: selectedOwner.id,
      });
      setAdminNotice(`Organization “${created.organization.name}” created successfully.`);
      setSelectedOwner(null);
      setOwnerQuery("");
      setEligibleUsers([]);
      setOwnerSearchPending(false);
      event.currentTarget.reset();
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Could not create the Organization");
    } finally {
      setOrganizationPending(false);
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
                <div className="space-y-3" role="region" aria-label="Pending email verification">
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
              {surface === "admin" && session.user.emailVerified && isPlatformAdmin && (
                <section
                  aria-label="Platform admin dashboard"
                  className="border-primary/20 bg-primary/5 space-y-4 rounded-lg border p-4"
                >
                  <div>
                    <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
                      Platform administration
                    </p>
                    <h2 className="text-2xl font-semibold">Create an Organization</h2>
                    <p className="text-muted-foreground text-sm">
                      Choose an existing verified user to receive the initial owner membership.
                    </p>
                  </div>
                  <form
                    className="space-y-3"
                    onSubmit={(event) => void handleOrganizationSubmit(event)}
                  >
                    <label className="block space-y-1 text-sm font-medium">
                      Organization name
                      <input
                        className="border-input bg-background w-full rounded-md border px-3 py-2"
                        name="organizationName"
                        autoComplete="organization"
                        required
                        minLength={2}
                        maxLength={120}
                      />
                    </label>
                    <label className="block space-y-1 text-sm font-medium">
                      Organization slug
                      <input
                        className="border-input bg-background w-full rounded-md border px-3 py-2"
                        name="organizationSlug"
                        pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                        required
                        minLength={2}
                        maxLength={80}
                      />
                    </label>
                    <label className="block space-y-1 text-sm font-medium">
                      Search eligible owner
                      <input
                        className="border-input bg-background w-full rounded-md border px-3 py-2"
                        aria-label="Search eligible owner"
                        value={ownerQuery}
                        onChange={(event) => {
                          setOwnerQuery(event.target.value);
                          setSelectedOwner(null);
                        }}
                        placeholder="Name or email"
                      />
                    </label>
                    {ownerSearchPending && (
                      <p className="text-muted-foreground text-sm" role="status">
                        Searching eligible owners…
                      </p>
                    )}
                    {eligibleUsers.length > 0 && (
                      <div aria-label="Eligible owners" className="space-y-2">
                        {eligibleUsers.map((user) => (
                          <button
                            className={`block w-full rounded-md border p-3 text-left text-sm ${
                              selectedOwner?.id === user.id
                                ? "border-primary bg-primary/10"
                                : "border-input"
                            }`}
                            key={user.id}
                            type="button"
                            onClick={() => setSelectedOwner(user)}
                          >
                            <span className="block font-medium">{user.name}</span>
                            <span className="text-muted-foreground block">{user.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedOwner && (
                      <p className="text-sm" role="status">
                        Owner selected: {selectedOwner.name} ({selectedOwner.email})
                      </p>
                    )}
                    {adminError && (
                      <p className="text-destructive text-sm" role="alert">
                        {adminError}
                      </p>
                    )}
                    {adminNotice && (
                      <p className="text-sm" role="status">
                        {adminNotice}
                      </p>
                    )}
                    <Button type="submit" disabled={organizationPending}>
                      {organizationPending ? "Creating Organization…" : "Create Organization"}
                    </Button>
                  </form>
                </section>
              )}
              {surface === "admin" && session.user.emailVerified && !isPlatformAdmin && (
                <p className="text-destructive text-sm" role="alert">
                  Platform administrator access is required.
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
              {surface === "manager" && managerAccess && (
                <section
                  aria-label={
                    activeOrganization ? "Organization manager dashboard" : "Organization access"
                  }
                  className="border-primary/20 bg-primary/5 space-y-4 rounded-lg border p-4"
                >
                  {activeOrganization ? (
                    <div className="space-y-2">
                      <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
                        Organization manager dashboard
                      </p>
                      <h2 className="text-2xl font-semibold">
                        {activeOrganization.organization.name}
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        You have owner access to this Organization.
                      </p>
                    </div>
                  ) : organizations === null ? (
                    <p className="text-muted-foreground text-sm" role="status">
                      Loading your Organizations…
                    </p>
                  ) : organizations.length === 0 ? (
                    <div>
                      <h2 className="text-2xl font-semibold">No Organizations yet</h2>
                      <p className="text-muted-foreground text-sm">
                        A platform administrator can assign you as an Organization owner.
                      </p>
                    </div>
                  ) : (
                    <p className="text-destructive text-sm" role="alert">
                      {organizationError ?? "Could not load your Organization"}
                    </p>
                  )}
                  {organizationError && activeOrganization && (
                    <p className="text-destructive text-sm" role="alert">
                      {organizationError}
                    </p>
                  )}
                </section>
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
