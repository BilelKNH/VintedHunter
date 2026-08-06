import type { Listing } from "@vinted-hunter/shared";
import { apiFetch, apiFetchPaginated, type PaginatedResult } from "./api-client";

export type ListingsSortBy = "newest" | "score" | "profit";

export function listListings(
  page: number,
  limit: number,
  sortBy: ListingsSortBy = "newest",
): Promise<PaginatedResult<Listing>> {
  return apiFetchPaginated<Listing>(`/listings?page=${page}&limit=${limit}&sortBy=${sortBy}`);
}

export function listFavoriteListings(
  page: number,
  limit: number,
): Promise<PaginatedResult<Listing>> {
  return apiFetchPaginated<Listing>(`/listings/favorites?page=${page}&limit=${limit}`);
}

export function getListing(id: string): Promise<Listing> {
  return apiFetch<Listing>(`/listings/${id}`);
}

export function toggleFavorite(id: string): Promise<{ favorited: boolean }> {
  return apiFetch<{ favorited: boolean }>(`/listings/${id}/favorite`, { method: "POST" });
}
