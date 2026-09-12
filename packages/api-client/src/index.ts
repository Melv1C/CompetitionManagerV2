import {
  apiErrorEnvelopeSchema,
  liveHealthSchema,
  readyHealthSchema,
  type LiveHealth,
  type ReadyHealth,
} from "@competition-manager/contracts";

export * from "./auth";
export * from "./organizations";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string;

  constructor(status: number, code: string, message: string, requestId: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

async function parseResponse<T>(
  response: Response,
  schema: { parse: (value: unknown) => T },
): Promise<T> {
  const body: unknown = await response.json();
  if (!response.ok && response.status !== 503) {
    const error = apiErrorEnvelopeSchema.parse(body).error;
    throw new ApiClientError(response.status, error.code, error.message, error.requestId);
  }
  return schema.parse(body);
}

export type HealthSnapshot = {
  live: LiveHealth;
  ready: ReadyHealth;
};

export async function fetchHealth(baseUrl: string): Promise<HealthSnapshot> {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const [liveResponse, readyResponse] = await Promise.all([
    fetch(`${normalizedBaseUrl}/api/v1/health/live`),
    fetch(`${normalizedBaseUrl}/api/v1/health/ready`),
  ]);

  const live = await parseResponse(liveResponse, liveHealthSchema);
  const ready = await parseResponse(readyResponse, readyHealthSchema);
  return { live, ready };
}
