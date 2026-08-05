import type { Purchase, PurchaseStats } from "@vinted-hunter/shared";
import { apiFetch, apiFetchPaginated, type PaginatedResult } from "./api-client";

export function listPurchases(page: number, limit: number): Promise<PaginatedResult<Purchase>> {
  return apiFetchPaginated<Purchase>(`/purchases?page=${page}&limit=${limit}`);
}

export function getPurchaseStats(): Promise<PurchaseStats> {
  return apiFetch<PurchaseStats>("/purchases/stats");
}

export function getActivePurchaseForListing(listingId: string): Promise<Purchase | null> {
  return apiFetch<Purchase | null>(`/purchases/by-listing/${listingId}`);
}

export function recordPurchase(listingId: string, purchasePrice: number): Promise<Purchase> {
  return apiFetch<Purchase>("/purchases", {
    method: "POST",
    body: JSON.stringify({ listingId, purchasePrice }),
  });
}

export function recordSale(purchaseId: string, sellingPrice: number): Promise<Purchase> {
  return apiFetch<Purchase>(`/purchases/${purchaseId}/sell`, {
    method: "PATCH",
    body: JSON.stringify({ sellingPrice }),
  });
}

export function cancelPurchase(purchaseId: string): Promise<Purchase> {
  return apiFetch<Purchase>(`/purchases/${purchaseId}/cancel`, { method: "PATCH" });
}
