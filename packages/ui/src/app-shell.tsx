import { fetchHealth } from "@competition-manager/api-client";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components";

export type AppShellProps = {
  surface: "frontend" | "manager" | "admin";
  backendUrl: string;
};

type BackendStatus = "checking" | "ready" | "unavailable";

export function AppShell({ surface, backendUrl }: AppShellProps): ReactElement {
  const [status, setStatus] = useState<BackendStatus>("checking");

  const checkBackend = useCallback(() => {
    setStatus("checking");
    void fetchHealth(backendUrl)
      .then(({ ready }) => setStatus(ready.status === "ready" ? "ready" : "unavailable"))
      .catch(() => setStatus("unavailable"));
  }, [backendUrl]);

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
        </CardContent>
      </Card>
    </main>
  );
}
