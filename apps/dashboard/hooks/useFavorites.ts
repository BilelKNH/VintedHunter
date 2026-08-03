import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth-store";
import { useFavoritesStore } from "../stores/favorites-store";
import * as listingsService from "../services/listings.service";

const FAVORITES_KEY = ["listings", "favorites"] as const;

export function useFavoriteListings(page: number, limit: number) {
  const status = useAuthStore((state) => state.status);
  const setFavoritedIds = useFavoritesStore((state) => state.setFavoritedIds);

  const query = useQuery({
    queryKey: [...FAVORITES_KEY, page, limit],
    queryFn: () => listingsService.listFavoriteListings(page, limit),
    enabled: status === "authenticated",
  });

  // Keep the optimistic favorites-store in sync with the server's source of truth whenever
  // this list is (re)fetched.
  useEffect(() => {
    if (query.data) {
      setFavoritedIds(query.data.items.map((listing) => listing.id));
    }
  }, [query.data, setFavoritedIds]);

  return query;
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const toggleLocal = useFavoritesStore((state) => state.toggle);

  return useMutation({
    mutationFn: (listingId: string) => listingsService.toggleFavorite(listingId),
    onMutate: (listingId: string) => {
      toggleLocal(listingId);
    },
    onError: (_error, listingId) => {
      // Revert the optimistic flip on failure.
      toggleLocal(listingId);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: FAVORITES_KEY });
    },
  });
}
