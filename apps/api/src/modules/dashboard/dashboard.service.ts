import type { DashboardStats } from "@vinted-hunter/shared";
import type { DashboardRepository } from "./dashboard.repository.js";

export interface DashboardServiceDeps {
  dashboardRepository: DashboardRepository;
}

export function createDashboardService({ dashboardRepository }: DashboardServiceDeps) {
  return {
    async getStats(userId: string): Promise<DashboardStats> {
      const [brandDistribution, categoryBreakdown, dailyActivity, averages, successRate] =
        await Promise.all([
          dashboardRepository.getBrandDistribution(),
          dashboardRepository.getCategoryBreakdown(),
          dashboardRepository.getDailyActivity(),
          dashboardRepository.getAverages(),
          dashboardRepository.getSuccessRate(userId),
        ]);

      return { brandDistribution, categoryBreakdown, dailyActivity, averages, successRate };
    },
  };
}
