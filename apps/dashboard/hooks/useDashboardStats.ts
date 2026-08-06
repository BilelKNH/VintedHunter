import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth-store";
import * as dashboardService from "../services/dashboard.service";

export function useDashboardStats() {
  const status = useAuthStore((state) => state.status);
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: dashboardService.getDashboardStats,
    enabled: status === "authenticated",
  });
}
