import type { CreateSearchBody, Search, UpdateSearchBody } from "@vinted-hunter/shared";
import { apiFetch } from "./api-client";

export function listSearches(): Promise<Search[]> {
  return apiFetch<Search[]>("/searches");
}

export function createSearch(input: CreateSearchBody): Promise<Search> {
  return apiFetch<Search>("/searches", { method: "POST", body: JSON.stringify(input) });
}

export function updateSearch(id: string, input: UpdateSearchBody): Promise<Search> {
  return apiFetch<Search>(`/searches/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteSearch(id: string): Promise<void> {
  return apiFetch<void>(`/searches/${id}`, { method: "DELETE" });
}
