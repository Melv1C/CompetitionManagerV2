import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ENV } from "varlock/env";

import type {
  Competition,
  CompetitionCatalog,
  CompetitionSummary,
  CreateCompetition,
  UpdateCompetitionDetails,
  UpdateCompetitionPricing,
  UpsertCompetitionEvent,
} from "./types";

const base = `${ENV.API_URL}/api/manager/organizations`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  const response = await fetch(`${base}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });
  const body = (await response.json().catch(() => null)) as
    | T
    | { error?: string; readiness?: { missing?: string[] } }
    | null;
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && body.error
        ? body.error
        : "Request failed";
    throw new Error(message);
  }
  return body as T;
}

export const competitionKeys = {
  list: (organizationId: string) => ["competitions", organizationId] as const,
  detail: (organizationId: string, competitionId: string) =>
    ["competition", organizationId, competitionId] as const,
  catalog: (organizationId: string, seasonId?: string) =>
    ["competition-catalog", organizationId, seasonId] as const,
};

export function useCompetitionCatalog(organizationId: string, seasonId?: string) {
  return useQuery({
    queryKey: competitionKeys.catalog(organizationId, seasonId),
    queryFn: () =>
      request<CompetitionCatalog>(
        `/${organizationId}/catalog${seasonId ? `?seasonId=${seasonId}` : ""}`,
      ),
  });
}

export function useCompetitions(organizationId: string) {
  return useQuery({
    queryKey: competitionKeys.list(organizationId),
    queryFn: async () =>
      (await request<{ competitions: CompetitionSummary[] }>(`/${organizationId}/competitions`))
        .competitions,
    // Authorization failures are deterministic and should be shown immediately.
    retry: false,
  });
}

export function useCompetition(organizationId: string, competitionId: string) {
  return useQuery({
    queryKey: competitionKeys.detail(organizationId, competitionId),
    queryFn: async () =>
      (
        await request<{ competition: Competition }>(
          `/${organizationId}/competitions/${competitionId}`,
        )
      ).competition,
  });
}

function useCompetitionMutation<TInput>(
  organizationId: string,
  competitionId: string,
  mutationFn: (input: TInput) => Promise<{ competition: Competition }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: ({ competition }) => {
      queryClient.setQueryData(competitionKeys.detail(organizationId, competitionId), competition);
      void queryClient.invalidateQueries({ queryKey: competitionKeys.list(organizationId) });
    },
  });
}

export function useCreateCompetition(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCompetition) =>
      request<{ competition: Competition }>(`/${organizationId}/competitions`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: competitionKeys.list(organizationId) }),
  });
}

export function useSaveCompetitionDetails(organizationId: string, competitionId: string) {
  return useCompetitionMutation<UpdateCompetitionDetails>(organizationId, competitionId, (input) =>
    request(`/${organizationId}/competitions/${competitionId}/details`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  );
}

export function useSaveCompetitionPricing(organizationId: string, competitionId: string) {
  return useCompetitionMutation<UpdateCompetitionPricing>(organizationId, competitionId, (input) =>
    request(`/${organizationId}/competitions/${competitionId}/pricing`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  );
}

export function useSaveCompetitionEvent(
  organizationId: string,
  competitionId: string,
  eventId?: string,
) {
  return useCompetitionMutation<UpsertCompetitionEvent>(organizationId, competitionId, (input) =>
    request(
      `/${organizationId}/competitions/${competitionId}/events${eventId ? `/${eventId}` : ""}`,
      { method: eventId ? "PUT" : "POST", body: JSON.stringify(input) },
    ),
  );
}

export function useDeleteCompetitionEvent(organizationId: string, competitionId: string) {
  return useCompetitionMutation<{ eventId: string; expectedUpdatedAt: string }>(
    organizationId,
    competitionId,
    ({ eventId, expectedUpdatedAt }) =>
      request(`/${organizationId}/competitions/${competitionId}/events/${eventId}`, {
        method: "DELETE",
        body: JSON.stringify({ expectedUpdatedAt }),
      }),
  );
}

export function usePublishCompetition(organizationId: string, competitionId: string) {
  return useCompetitionMutation<{ expectedUpdatedAt: string }>(
    organizationId,
    competitionId,
    (input) =>
      request(`/${organizationId}/competitions/${competitionId}/publish`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
  );
}

export function useDeleteCompetition(organizationId: string, competitionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { expectedUpdatedAt: string; reason: string }) =>
      request<{ deleted: true }>(`/${organizationId}/competitions/${competitionId}`, {
        method: "DELETE",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: competitionKeys.detail(organizationId, competitionId),
      });
      void queryClient.invalidateQueries({ queryKey: competitionKeys.list(organizationId) });
    },
  });
}
