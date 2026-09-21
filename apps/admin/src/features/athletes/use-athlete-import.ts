import {
  AthleteImportBatchResponse$,
  AthleteImportBatchesResponse$,
  AthleteImportSeasonsResponse$,
  type AthleteImportBatch,
} from "@repo/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";

async function getErrorMessage(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
    errors?: Array<{ row?: number | null; message?: string }>;
  } | null;
  const firstDetail = body?.errors?.[0];
  if (firstDetail?.message) {
    return `${body?.error ?? fallback}: ${firstDetail.row ? `row ${firstDetail.row}, ` : ""}${firstDetail.message}`;
  }
  return body?.error ?? fallback;
}

export function useAthleteImportSeasons() {
  return useQuery({
    queryKey: ["athlete-import-seasons"],
    queryFn: async () => {
      const response = await apiClient.api["athlete-imports"].seasons.$get();
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to load LRBA seasons"));
      }
      return AthleteImportSeasonsResponse$.parse(await response.json());
    },
  });
}

export function useAthleteImports() {
  return useQuery({
    queryKey: ["athlete-imports"],
    queryFn: async () => {
      const response = await apiClient.api["athlete-imports"].$get();
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to load athlete imports"));
      }
      return AthleteImportBatchesResponse$.parse(await response.json()).batches;
    },
    refetchInterval: (query) => {
      const batches = query.state.data as AthleteImportBatch[] | undefined;
      return batches?.some((batch) => batch.state === "QUEUED" || batch.state === "PROCESSING")
        ? 1_500
        : false;
    },
  });
}

export function useAthleteImportBatch(batchId: string | undefined) {
  return useQuery({
    queryKey: ["athlete-import", batchId],
    enabled: Boolean(batchId),
    queryFn: async () => {
      const response = await apiClient.api["athlete-imports"][":batchId"].$get({
        param: { batchId: batchId! },
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to load athlete import"));
      }
      return AthleteImportBatchResponse$.parse(await response.json()).batch;
    },
    refetchInterval: (query) => {
      const state = (query.state.data as AthleteImportBatch | undefined)?.state;
      return state === "QUEUED" || state === "PROCESSING" ? 1_500 : false;
    },
  });
}

export function usePreviewAthleteImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, seasonCode }: { file: File; seasonCode: string }) => {
      const response = await apiClient.api["athlete-imports"].preview.$post({
        form: { file, seasonCode },
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to preview athlete import"));
      }
      return AthleteImportBatchResponse$.parse(await response.json()).batch;
    },
    onSuccess: (batch) => {
      queryClient.setQueryData(["athlete-import", batch.id], batch);
      queryClient.invalidateQueries({ queryKey: ["athlete-imports"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useConfirmAthleteImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, batchId }: { file: File; batchId: string }) => {
      const response = await apiClient.api["athlete-imports"].confirm.$post({
        form: { file, batchId },
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to confirm athlete import"));
      }
      return AthleteImportBatchResponse$.parse(await response.json()).batch;
    },
    onSuccess: (batch) => {
      queryClient.setQueryData(["athlete-import", batch.id], batch);
      queryClient.invalidateQueries({ queryKey: ["athlete-imports"] });
      toast.success("LRBA athlete import queued");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
