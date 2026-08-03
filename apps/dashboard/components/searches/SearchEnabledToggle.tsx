"use client";

import { toast } from "sonner";
import { Switch } from "../ui/switch";
import { useUpdateSearch } from "../../hooks/useSearches";

export interface SearchEnabledToggleProps {
  searchId: string;
  enabled: boolean;
}

export function SearchEnabledToggle({ searchId, enabled }: SearchEnabledToggleProps) {
  const updateSearch = useUpdateSearch();

  function handleChange(next: boolean) {
    updateSearch.mutate(
      { id: searchId, input: { enabled: next } },
      { onError: () => toast.error("Could not update search") },
    );
  }

  return (
    <Switch checked={enabled} onCheckedChange={handleChange} disabled={updateSearch.isPending} />
  );
}
