import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateSearchBody, UpdateSearchBody } from "@vinted-hunter/shared";
import { useAuthStore } from "../stores/auth-store";
import * as searchesService from "../services/searches.service";

const SEARCHES_KEY = ["searches"] as const;

export function useSearches() {
  const status = useAuthStore((state) => state.status);
  return useQuery({
    queryKey: SEARCHES_KEY,
    queryFn: searchesService.listSearches,
    enabled: status === "authenticated",
  });
}

export function useCreateSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSearchBody) => searchesService.createSearch(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SEARCHES_KEY });
    },
  });
}

export function useUpdateSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSearchBody }) =>
      searchesService.updateSearch(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SEARCHES_KEY });
    },
  });
}

export function useDeleteSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => searchesService.deleteSearch(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SEARCHES_KEY });
    },
  });
}
