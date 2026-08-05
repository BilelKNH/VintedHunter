import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateManualComparableBody } from "@vinted-hunter/shared";
import * as manualComparablesService from "../services/manual-comparables.service";

function queryKey(listingId: string) {
  return ["manual-comparables", listingId] as const;
}

export function useManualComparables(listingId: string) {
  return useQuery({
    queryKey: queryKey(listingId),
    queryFn: () => manualComparablesService.listManualComparables(listingId),
    enabled: Boolean(listingId),
  });
}

export function useCreateManualComparable(listingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateManualComparableBody) =>
      manualComparablesService.createManualComparable(listingId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKey(listingId) });
    },
  });
}

export function useDeleteManualComparable(listingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => manualComparablesService.deleteManualComparable(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKey(listingId) });
    },
  });
}
