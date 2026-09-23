import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

import type {
  Competition,
  CreateOrganizationDiscipline,
  CreateCompetition,
  UpdateCompetitionDetails,
  UpdateCompetitionPricing,
  UpsertCompetitionEvent,
} from "./types";

const organizationsApi = apiClient.api.manager.organizations[":organizationId"];
const competitionsApi = organizationsApi.competitions;

async function throwResponseError(response: Response, fallback: string): Promise<never> {
  const body: unknown = await response.json().catch(() => null);
  const message =
    body && typeof body === "object" && "error" in body && typeof body.error === "string"
      ? body.error
      : fallback;
  throw new Error(message);
}

export const competitionKeys = {
  list: (organizationId: string) => ["competitions", organizationId] as const,
  detail: (organizationId: string, competitionId: string) =>
    ["competition", organizationId, competitionId] as const,
  catalog: (organizationId: string) => ["competition-catalog", organizationId] as const,
};

export function useCompetitionCatalog(organizationId: string) {
  return useQuery({
    queryKey: competitionKeys.catalog(organizationId),
    queryFn: async () => {
      const response = await organizationsApi.catalog.$get({ param: { organizationId } });
      if (!response.ok) return throwResponseError(response, "Failed to load Competition catalog");
      return response.json();
    },
  });
}

export function useCreateOrganizationDiscipline(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOrganizationDiscipline) => {
      const response = await organizationsApi.catalog.disciplines.$post({
        param: { organizationId },
        json: input,
      });
      if (!response.ok) return throwResponseError(response, "Failed to create Discipline");
      return response.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["competition-catalog", organizationId] }),
  });
}

export function useCompetitions(organizationId: string) {
  return useQuery({
    queryKey: competitionKeys.list(organizationId),
    queryFn: async () => {
      const response = await competitionsApi.$get({ param: { organizationId } });
      if (!response.ok) return throwResponseError(response, "Failed to load Competitions");
      return (await response.json()).competitions;
    },
    // Authorization failures are deterministic and should be shown immediately.
    retry: false,
  });
}

export function useCompetition(organizationId: string, competitionId: string) {
  return useQuery({
    queryKey: competitionKeys.detail(organizationId, competitionId),
    queryFn: async () => {
      const response = await competitionsApi[":competitionId"].$get({
        param: { organizationId, competitionId },
      });
      if (!response.ok) return throwResponseError(response, "Failed to load Competition");
      return (await response.json()).competition;
    },
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
    mutationFn: async (input: CreateCompetition) => {
      const response = await competitionsApi.$post({
        param: { organizationId },
        json: input,
      });
      if (!response.ok) return throwResponseError(response, "Failed to create Competition");
      return response.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: competitionKeys.list(organizationId) }),
  });
}

export function useSaveCompetitionDetails(organizationId: string, competitionId: string) {
  return useCompetitionMutation<UpdateCompetitionDetails>(
    organizationId,
    competitionId,
    async (input) => {
      const response = await competitionsApi[":competitionId"].details.$put({
        param: { organizationId, competitionId },
        json: input,
      });
      if (!response.ok) return throwResponseError(response, "Failed to save Competition details");
      return response.json();
    },
  );
}

export function useSaveCompetitionPricing(organizationId: string, competitionId: string) {
  return useCompetitionMutation<UpdateCompetitionPricing>(
    organizationId,
    competitionId,
    async (input) => {
      const response = await competitionsApi[":competitionId"].pricing.$put({
        param: { organizationId, competitionId },
        json: input,
      });
      if (!response.ok) return throwResponseError(response, "Failed to save Competition pricing");
      return response.json();
    },
  );
}

export function useSaveCompetitionEvent(
  organizationId: string,
  competitionId: string,
  eventId?: string,
) {
  return useCompetitionMutation<UpsertCompetitionEvent>(
    organizationId,
    competitionId,
    async (input) => {
      const competitionApi = competitionsApi[":competitionId"];
      const response = eventId
        ? await competitionApi.events[":eventId"].$put({
            param: { organizationId, competitionId, eventId },
            json: input,
          })
        : await competitionApi.events.$post({
            param: { organizationId, competitionId },
            json: input,
          });
      if (!response.ok) return throwResponseError(response, "Failed to save Competition Event");
      return response.json();
    },
  );
}

export function useDeleteCompetitionEvent(organizationId: string, competitionId: string) {
  return useCompetitionMutation<{ eventId: string; expectedUpdatedAt: string }>(
    organizationId,
    competitionId,
    async ({ eventId, expectedUpdatedAt }) => {
      const response = await competitionsApi[":competitionId"].events[":eventId"].$delete({
        param: { organizationId, competitionId, eventId },
        json: { expectedUpdatedAt },
      });
      if (!response.ok) return throwResponseError(response, "Failed to delete Competition Event");
      return response.json();
    },
  );
}

export function usePublishCompetition(organizationId: string, competitionId: string) {
  return useCompetitionMutation<{ expectedUpdatedAt: string }>(
    organizationId,
    competitionId,
    async (input) => {
      const response = await competitionsApi[":competitionId"].publish.$post({
        param: { organizationId, competitionId },
        json: input,
      });
      if (!response.ok) return throwResponseError(response, "Failed to publish Competition");
      return response.json();
    },
  );
}

export function useDeleteCompetition(organizationId: string, competitionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { expectedUpdatedAt: string; reason: string }) => {
      const response = await competitionsApi[":competitionId"].$delete({
        param: { organizationId, competitionId },
        json: input,
      });
      if (!response.ok) return throwResponseError(response, "Failed to delete Competition Draft");
      return response.json();
    },
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: competitionKeys.detail(organizationId, competitionId),
      });
      void queryClient.invalidateQueries({ queryKey: competitionKeys.list(organizationId) });
    },
  });
}
