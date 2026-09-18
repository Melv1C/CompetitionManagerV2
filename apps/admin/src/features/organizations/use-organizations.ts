import {
  OrganizationOwnerCandidatesResponse$,
  OrganizationResponse$,
  OrganizationsResponse$,
  type CreateOrganization,
} from "@repo/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";

const ORGANIZATIONS_QUERY_KEY = "organizations";

async function getErrorMessage(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? fallback;
}

export function useOrganizations() {
  return useQuery({
    queryKey: [ORGANIZATIONS_QUERY_KEY],
    queryFn: async () => {
      const response = await apiClient.api.organizations.$get();
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to load organizations"));
      }

      return OrganizationsResponse$.parse(await response.json()).organizations;
    },
  });
}

export function useOrganizationOwnerCandidates(search: string) {
  return useQuery({
    queryKey: ["organization-owner-candidates", search],
    queryFn: async () => {
      const response = await apiClient.api.organizations["owner-candidates"].$get({
        query: { search: search.trim() || undefined },
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to load owner candidates"));
      }

      return OrganizationOwnerCandidatesResponse$.parse(await response.json()).users;
    },
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrganization) => {
      const response = await apiClient.api.organizations.$post({ json: data });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to create organization"));
      }

      return OrganizationResponse$.parse(await response.json()).organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORGANIZATIONS_QUERY_KEY] });
      toast.success("Organization created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
