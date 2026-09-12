import {
  liveHealthSchema,
  readyHealthSchema,
  type LiveHealth,
  type ReadyHealth,
} from "@competition-manager/contracts";

export type HealthSnapshot = {
  live: LiveHealth;
  ready: ReadyHealth;
};

export async function fetchHealth(baseUrl: string): Promise<HealthSnapshot> {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const [liveResponse, readyResponse] = await Promise.all([
    fetch(`${normalizedBaseUrl}/health/live`),
    fetch(`${normalizedBaseUrl}/health/ready`),
  ]);

  const live = liveHealthSchema.parse(await liveResponse.json());
  const ready = readyHealthSchema.parse(await readyResponse.json());
  return { live, ready };
}
