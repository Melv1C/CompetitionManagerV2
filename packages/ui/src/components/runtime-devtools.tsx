import { EventClient } from "@tanstack/devtools-event-client";
import { useEffect, useMemo, useState } from "react";

export interface RuntimeSnapshot {
  application: string;
  path: string;
  timestamp: number;
}

type RuntimeEvents = {
  navigation: RuntimeSnapshot;
};

class RuntimeEventClient extends EventClient<RuntimeEvents> {
  constructor() {
    super({ pluginId: "competition-manager-runtime" });
  }
}

let runtimeEventClient: RuntimeEventClient | undefined;

export function getRuntimeEventClient() {
  runtimeEventClient ??= new RuntimeEventClient();
  return runtimeEventClient;
}

export function createRuntimeSnapshot(application: string, path: string): RuntimeSnapshot {
  return { application, path, timestamp: Date.now() };
}

interface RuntimeDevtoolsPanelProps {
  application: string;
  path: string;
}

export function RuntimeDevtoolsPanel({ application, path }: RuntimeDevtoolsPanelProps) {
  const eventClient = getRuntimeEventClient();
  const snapshot = useMemo(() => createRuntimeSnapshot(application, path), [application, path]);
  const [snapshots, setSnapshots] = useState<Array<RuntimeSnapshot>>([]);

  useEffect(
    () =>
      eventClient.on("navigation", ({ payload }) => {
        setSnapshots((current) => {
          const latest = current.at(-1);
          if (
            latest?.application === payload.application &&
            latest.path === payload.path &&
            latest.timestamp === payload.timestamp
          ) {
            return current;
          }

          return [...current.slice(-9), payload];
        });
      }),
    [eventClient],
  );

  useEffect(() => {
    eventClient.emit("navigation", snapshot);
  }, [eventClient, snapshot]);

  const recentSnapshots = snapshots.length > 0 ? snapshots : [snapshot];

  return (
    <section
      aria-label={`${application} runtime`}
      style={{
        boxSizing: "border-box",
        color: "inherit",
        display: "grid",
        gap: 16,
        padding: 16,
      }}
    >
      <div>
        <div style={{ fontSize: 12, opacity: 0.65 }}>Application</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{application}</div>
      </div>

      <div>
        <div style={{ fontSize: 12, opacity: 0.65 }}>Current route</div>
        <code style={{ overflowWrap: "anywhere" }}>{path}</code>
      </div>

      <div>
        <div style={{ fontSize: 12, opacity: 0.65 }}>Recent navigation events</div>
        <ol style={{ display: "grid", gap: 8, margin: "8px 0 0", paddingLeft: 20 }}>
          {recentSnapshots
            .slice()
            .reverse()
            .map((snapshot) => (
              <li key={`${snapshot.timestamp}-${snapshot.path}`}>
                <code style={{ overflowWrap: "anywhere" }}>{snapshot.path}</code>
                <span style={{ fontSize: 12, marginLeft: 8, opacity: 0.65 }}>
                  {new Date(snapshot.timestamp).toLocaleTimeString()}
                </span>
              </li>
            ))}
        </ol>
      </div>
    </section>
  );
}
