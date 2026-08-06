import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDashboardService } from "./dashboard.service.js";
import type { DashboardRepository } from "./dashboard.repository.js";

describe("dashboard.service", () => {
  let dashboardRepository: DashboardRepository;
  let service: ReturnType<typeof createDashboardService>;

  beforeEach(() => {
    dashboardRepository = {
      getBrandDistribution: vi.fn(),
      getCategoryBreakdown: vi.fn(),
      getDailyActivity: vi.fn(),
      getAverages: vi.fn(),
      getSuccessRate: vi.fn(),
    };
    service = createDashboardService({ dashboardRepository });
  });

  it("composes all five repository calls into one DashboardStats object", async () => {
    vi.mocked(dashboardRepository.getBrandDistribution).mockResolvedValue([
      { brand: "Nike", count: 5 },
    ]);
    vi.mocked(dashboardRepository.getCategoryBreakdown).mockResolvedValue([
      { category: "Hoodie", recommendation: "STRONG_BUY", count: 3 },
    ]);
    vi.mocked(dashboardRepository.getDailyActivity).mockResolvedValue([
      { date: "2026-08-06", count: 2, averageScore: 70 },
    ]);
    vi.mocked(dashboardRepository.getAverages).mockResolvedValue({
      averageRoi: 42,
      averageScore: 65,
      totalAnalyzed: 10,
    });
    vi.mocked(dashboardRepository.getSuccessRate).mockResolvedValue(75);

    const result = await service.getStats("user-1");

    expect(result).toEqual({
      brandDistribution: [{ brand: "Nike", count: 5 }],
      categoryBreakdown: [{ category: "Hoodie", recommendation: "STRONG_BUY", count: 3 }],
      dailyActivity: [{ date: "2026-08-06", count: 2, averageScore: 70 }],
      averages: { averageRoi: 42, averageScore: 65, totalAnalyzed: 10 },
      successRate: 75,
    });
    expect(dashboardRepository.getSuccessRate).toHaveBeenCalledWith("user-1");
  });

  it("passes through a null successRate when the user has no sold purchases", async () => {
    vi.mocked(dashboardRepository.getBrandDistribution).mockResolvedValue([]);
    vi.mocked(dashboardRepository.getCategoryBreakdown).mockResolvedValue([]);
    vi.mocked(dashboardRepository.getDailyActivity).mockResolvedValue([]);
    vi.mocked(dashboardRepository.getAverages).mockResolvedValue({
      averageRoi: null,
      averageScore: null,
      totalAnalyzed: 0,
    });
    vi.mocked(dashboardRepository.getSuccessRate).mockResolvedValue(null);

    const result = await service.getStats("user-1");

    expect(result.successRate).toBeNull();
  });
});
