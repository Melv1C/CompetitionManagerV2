import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export class PublicCompetitionApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function throwResponseError(response: Response, fallback: string): Promise<never> {
  const body: unknown = await response.json().catch(() => null);
  const message =
    body && typeof body === "object" && "error" in body && typeof body.error === "string"
      ? body.error
      : fallback;
  throw new PublicCompetitionApiError(message, response.status);
}

export const publicCompetitionKeys = {
  all: ["public-competitions"] as const,
  list: (input: { q?: string; disciplineId?: string; limit: number }) =>
    [...publicCompetitionKeys.all, "list", input] as const,
  detail: (competitionId: string) =>
    [...publicCompetitionKeys.all, "detail", competitionId] as const,
};

export function publicCompetitionQuery(
  input: { q?: string; disciplineId?: string; limit?: number },
  cursor?: string,
) {
  return {
    q: input.q,
    disciplineId: input.disciplineId,
    cursor,
    limit: String(input.limit ?? 12),
  };
}

export function usePublicCompetitions(input: {
  q?: string;
  disciplineId?: string;
  limit?: number;
}) {
  const limit = input.limit ?? 12;
  return useInfiniteQuery({
    queryKey: publicCompetitionKeys.list({ ...input, limit }),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.api.competitions.$get({
        query: publicCompetitionQuery({ ...input, limit }, pageParam),
      });
      if (!response.ok) return throwResponseError(response, "Failed to load Competitions");
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  });
}

export function usePublicCompetition(competitionId: string) {
  return useQuery({
    queryKey: publicCompetitionKeys.detail(competitionId),
    queryFn: async () => {
      const response = await apiClient.api.competitions[":competitionId"].$get({
        param: { competitionId },
      });
      if (!response.ok) return throwResponseError(response, "Failed to load Competition");
      return (await response.json()).competition;
    },
    retry: (failureCount, error) =>
      !(error instanceof PublicCompetitionApiError && error.status === 404) && failureCount < 2,
  });
}
