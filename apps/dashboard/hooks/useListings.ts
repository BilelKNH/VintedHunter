import { useQuery } from "@tanstack/react-query";
import * as listingsService from "../services/listings.service";
import type { ListingsSortBy } from "../services/listings.service";

export function useListings(page: number, limit: number, sortBy: ListingsSortBy = "newest") {
  return useQuery({
    queryKey: ["listings", page, limit, sortBy],
    queryFn: () => listingsService.listListings(page, limit, sortBy),
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ["listings", id],
    queryFn: () => listingsService.getListing(id),
    enabled: Boolean(id),
  });
}
