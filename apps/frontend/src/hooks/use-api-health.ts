import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function useAPIHealth() {
  return useQuery({
    queryKey: ["api-health"],
    queryFn: async () => {
      const res = await apiClient.api.health.$get();
      if (res.ok) {
        return await res.json();
      }
    },
  });
}
