import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../services/api-client";

const NON_RETRYABLE_STATUSES = new Set([401, 403, 404]);

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && NON_RETRYABLE_STATUSES.has(error.status)) {
            return false;
          }
          return failureCount < 2;
        },
      },
    },
  });
}
