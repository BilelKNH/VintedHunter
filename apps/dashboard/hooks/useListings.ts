import { useQuery } from "@tanstack/react-query";
import * as listingsService from "../services/listings.service";

export function useListings(page: number, limit: number) {
  return useQuery({
    queryKey: ["listings", page, limit],
    queryFn: () => listingsService.listListings(page, limit),
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ["listings", id],
    queryFn: () => listingsService.getListing(id),
    enabled: Boolean(id),
  });
}
