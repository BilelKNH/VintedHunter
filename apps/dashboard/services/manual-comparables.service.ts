import type { CreateManualComparableBody, ManualComparable } from "@vinted-hunter/shared";
import { apiFetch } from "./api-client";

export function listManualComparables(listingId: string): Promise<ManualComparable[]> {
  return apiFetch<ManualComparable[]>(`/listings/${listingId}/manual-comparables`);
}

export function createManualComparable(
  listingId: string,
  input: CreateManualComparableBody,
): Promise<ManualComparable> {
  return apiFetch<ManualComparable>(`/listings/${listingId}/manual-comparables`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteManualComparable(id: string): Promise<void> {
  return apiFetch<void>(`/manual-comparables/${id}`, { method: "DELETE" });
}
