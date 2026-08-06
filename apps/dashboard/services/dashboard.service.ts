import type { DashboardStats } from "@vinted-hunter/shared";
import { apiFetch } from "./api-client";

export function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/dashboard/stats");
}
