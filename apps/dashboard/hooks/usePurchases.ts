import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth-store";
import * as purchasesService from "../services/purchases.service";

const PURCHASES_KEY = ["purchases"] as const;
const STATS_KEY = ["purchases", "stats"] as const;

function invalidatePurchaseQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  listingId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: PURCHASES_KEY });
  if (listingId) {
    void queryClient.invalidateQueries({ queryKey: ["purchases", "by-listing", listingId] });
  }
}

export function usePurchases(page: number, limit: number) {
  const status = useAuthStore((state) => state.status);
  return useQuery({
    queryKey: [...PURCHASES_KEY, page, limit],
    queryFn: () => purchasesService.listPurchases(page, limit),
    enabled: status === "authenticated",
  });
}

export function usePurchaseStats() {
  const status = useAuthStore((state) => state.status);
  return useQuery({
    queryKey: STATS_KEY,
    queryFn: purchasesService.getPurchaseStats,
    enabled: status === "authenticated",
  });
}

export function usePurchaseForListing(listingId: string) {
  const status = useAuthStore((state) => state.status);
  return useQuery({
    queryKey: ["purchases", "by-listing", listingId],
    queryFn: () => purchasesService.getActivePurchaseForListing(listingId),
    enabled: status === "authenticated" && Boolean(listingId),
  });
}

export function useRecordPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, purchasePrice }: { listingId: string; purchasePrice: number }) =>
      purchasesService.recordPurchase(listingId, purchasePrice),
    onSuccess: (purchase) => invalidatePurchaseQueries(queryClient, purchase.listingId),
  });
}

export function useRecordSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ purchaseId, sellingPrice }: { purchaseId: string; sellingPrice: number }) =>
      purchasesService.recordSale(purchaseId, sellingPrice),
    onSuccess: (purchase) => invalidatePurchaseQueries(queryClient, purchase.listingId),
  });
}

export function useCancelPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (purchaseId: string) => purchasesService.cancelPurchase(purchaseId),
    onSuccess: (purchase) => invalidatePurchaseQueries(queryClient, purchase.listingId),
  });
}
