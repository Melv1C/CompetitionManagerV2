import {
  apiErrorEnvelopeSchema,
  clubListResponseSchema,
  clubResponseSchema,
  type ClubCreateRequest,
  type ClubListResponse,
  type ClubResponse,
} from "@competition-manager/contracts";

import { ApiClientError } from "./index";

type ClubFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type ClubClient = {
  listClubs(): Promise<ClubListResponse>;
  getClub(clubId: string): Promise<ClubResponse>;
  createClub(input: ClubCreateRequest, idempotencyKey?: string): Promise<ClubResponse>;
};

export type { Club, ClubMembership, ClubResponse } from "@competition-manager/contracts";

async function parseClubResponse<T>(
  response: Response,
  schema: { parse: (value: unknown) => T },
): Promise<T> {
  const body: unknown = await response.json();
  if (!response.ok) {
    const error = apiErrorEnvelopeSchema.parse(body).error;
    throw new ApiClientError(response.status, error.code, error.message, error.requestId);
  }
  return schema.parse(body);
}

export function createClubClient(baseUrl: string, fetcher: ClubFetch = fetch): ClubClient {
  const endpoint = `${baseUrl.replace(/\/$/, "")}/api/v1/clubs`;

  async function request(path = "", init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");
    const response = await fetcher(`${endpoint}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
    return response;
  }

  return {
    async listClubs() {
      return parseClubResponse(await request(), clubListResponseSchema);
    },
    async getClub(clubId) {
      return parseClubResponse(await request(`/${encodeURIComponent(clubId)}`), clubResponseSchema);
    },
    async createClub(input, idempotencyKey = crypto.randomUUID()) {
      return parseClubResponse(
        await request("", {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey },
          body: JSON.stringify(input),
        }),
        clubResponseSchema,
      );
    },
  };
}
