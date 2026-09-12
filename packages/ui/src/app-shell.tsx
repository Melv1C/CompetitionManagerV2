import { useEffect, useState, type ReactElement } from "react";

import { fetchHealth } from "@competition-manager/api-client";

import "./app-shell.css";

export type AppShellProps = {
  surface: "frontend" | "manager" | "admin";
  backendUrl: string;
};

export function AppShell({ surface, backendUrl }: AppShellProps): ReactElement {
  const [status, setStatus] = useState<"checking" | "ready" | "unavailable">("checking");

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

  return (
    <main className="app-shell">
      <p className="eyebrow">Competition Manager</p>
      <h1>{surface === "frontend" ? "Public competition access" : `${surface} application`}</h1>
      <p className="lede">
        This application uses the shared backend contract and authenticated session boundary.
      </p>
      <div className={`status status-${status}`} role="status">
        <span aria-hidden="true" />
        Backend {status}
      </div>
    </main>
  );
}
