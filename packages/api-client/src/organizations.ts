import {
  apiErrorEnvelopeSchema,
  eligibleUserListResponseSchema,
  organizationListResponseSchema,
  organizationResponseSchema,
  type EligibleUserListResponse,
  type OrganizationCreateRequest,
  type OrganizationListResponse,
  type OrganizationResponse,
} from "@competition-manager/contracts";

import { ApiClientError } from "./index";

type OrganizationFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function requestFingerprint(input: OrganizationCreateRequest): string {
  return JSON.stringify(input);
}

export type OrganizationClient = {
  listOrganizations(): Promise<OrganizationListResponse>;
  getOrganization(organizationId: string): Promise<OrganizationResponse>;
};

export type AdminOrganizationClient = {
  searchEligibleUsers(query: string): Promise<EligibleUserListResponse>;
  createOrganization(
    input: OrganizationCreateRequest,
    idempotencyKey?: string,
  ): Promise<OrganizationResponse>;
};

export type {
  EligibleUser,
  EligibleUserListResponse,
  Organization,
  OrganizationCreateRequest,
  OrganizationListResponse,
  OrganizationMembership,
  OrganizationResponse,
} from "@competition-manager/contracts";

async function parseResponse<T>(
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

function createRequest(
  baseUrl: string,
  fetcher: OrganizationFetch,
  endpoint: string,
  path = "",
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  return fetcher(`${baseUrl.replace(/\/$/, "")}${endpoint}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });
}

export function createOrganizationClient(
  baseUrl: string,
  fetcher: OrganizationFetch = fetch,
): OrganizationClient {
  const endpoint = "/api/v1/manager/organizations";
  return {
    async listOrganizations() {
      return parseResponse(
        await createRequest(baseUrl, fetcher, endpoint),
        organizationListResponseSchema,
      );
    },
    async getOrganization(organizationId) {
      return parseResponse(
        await createRequest(baseUrl, fetcher, endpoint, `/${encodeURIComponent(organizationId)}`),
        organizationResponseSchema,
      );
    },
  };
}

export function createAdminOrganizationClient(
  baseUrl: string,
  fetcher: OrganizationFetch = fetch,
): AdminOrganizationClient {
  const endpoint = "/api/v1/admin";
  let pendingCreation: { fingerprint: string; idempotencyKey: string } | null = null;
  return {
    async searchEligibleUsers(query) {
      return parseResponse(
        await createRequest(
          baseUrl,
          fetcher,
          endpoint,
          `/users?query=${encodeURIComponent(query)}`,
        ),
        eligibleUserListResponseSchema,
      );
    },
    async createOrganization(input, idempotencyKey) {
      const fingerprint = requestFingerprint(input);
      const key =
        pendingCreation?.fingerprint === fingerprint
          ? pendingCreation.idempotencyKey
          : (idempotencyKey ?? crypto.randomUUID());
      pendingCreation = { fingerprint, idempotencyKey: key };
      try {
        const result = await parseResponse(
          await createRequest(baseUrl, fetcher, endpoint, "/organizations", {
            method: "POST",
            headers: { "Idempotency-Key": key },
            body: JSON.stringify(input),
          }),
          organizationResponseSchema,
        );
        pendingCreation = null;
        return result;
      } catch (error) {
        // Retain the key so a lost or recoverable response can be retried safely.
        throw error;
      }
    },
  };
}
