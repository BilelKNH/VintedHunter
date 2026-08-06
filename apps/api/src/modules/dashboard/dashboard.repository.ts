import type { PrismaClient } from "@vinted-hunter/database";
import { recommendationForScore } from "@vinted-hunter/analyzer";
import type {
  BrandCount,
  CategoryRecommendationCount,
  DailyActivityPoint,
  DashboardAverages,
} from "@vinted-hunter/shared";

const DAILY_ACTIVITY_WINDOW_DAYS = 30;
const BRAND_DISTRIBUTION_LIMIT = 8;

export interface DashboardRepository {
  getBrandDistribution(): Promise<BrandCount[]>;
  getCategoryBreakdown(): Promise<CategoryRecommendationCount[]>;
  getDailyActivity(): Promise<DailyActivityPoint[]>;
  getAverages(): Promise<DashboardAverages>;
  getSuccessRate(userId: string): Promise<number | null>;
}

// Builds the last 30 (inclusive of today) empty day buckets, oldest first — same day-loop
// algorithm as the client-side SearchActivityChart it replaces, just fed by a real query.
function buildEmptyDayBuckets(days: number): Map<string, { count: number; scoreSum: number }> {
  const buckets = new Map<string, { count: number; scoreSum: number }>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    buckets.set(date.toISOString().slice(0, 10), { count: 0, scoreSum: 0 });
  }
  return buckets;
}

export function createDashboardRepository(prisma: PrismaClient): DashboardRepository {
  return {
    async getBrandDistribution() {
      const rows = await prisma.listing.groupBy({
        by: ["brand"],
        where: { brand: { not: null } },
        _count: { brand: true },
        orderBy: { _count: { brand: "desc" } },
        take: BRAND_DISTRIBUTION_LIMIT,
      });
      // brand is never null here (filtered by `where`) — Prisma's groupBy return type just
      // can't express that narrowing, so the fallback only exists to satisfy the type.
      return rows.map((row) => ({ brand: row.brand ?? "Unknown", count: row._count.brand }));
    },

    async getCategoryBreakdown() {
      // `recommendation` is derived from `score` (recommendationForScore), not a column, so
      // groupBy can't bucket by it without raw SQL — same hybrid fetch-then-bucket style as
      // purchases.repository.ts's getStatsByUserId. Bucketed as category -> recommendation ->
      // count (rather than a joined string key) so category values containing spaces stay safe.
      const rows = await prisma.listing.findMany({
        where: { category: { not: null }, analysis: { isNot: null } },
        select: { category: true, analysis: { select: { score: true } } },
      });

      const byCategory = new Map<
        string,
        Map<CategoryRecommendationCount["recommendation"], number>
      >();
      for (const row of rows) {
        if (!row.category || !row.analysis) continue;
        const recommendation = recommendationForScore(row.analysis.score);
        const byRecommendation = byCategory.get(row.category) ?? new Map();
        byRecommendation.set(recommendation, (byRecommendation.get(recommendation) ?? 0) + 1);
        byCategory.set(row.category, byRecommendation);
      }

      return Array.from(byCategory.entries()).flatMap(([category, byRecommendation]) =>
        Array.from(byRecommendation.entries()).map(([recommendation, count]) => ({
          category,
          recommendation,
          count,
        })),
      );
    },

    async getDailyActivity() {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - (DAILY_ACTIVITY_WINDOW_DAYS - 1));
      cutoff.setHours(0, 0, 0, 0);

      const rows = await prisma.analysis.findMany({
        where: { createdAt: { gte: cutoff } },
        select: { createdAt: true, score: true },
      });

      const buckets = buildEmptyDayBuckets(DAILY_ACTIVITY_WINDOW_DAYS);
      for (const row of rows) {
        const bucket = buckets.get(row.createdAt.toISOString().slice(0, 10));
        if (!bucket) continue;
        bucket.count += 1;
        bucket.scoreSum += row.score;
      }

      return Array.from(buckets.entries()).map(([date, bucket]) => ({
        date,
        count: bucket.count,
        averageScore: bucket.count > 0 ? bucket.scoreSum / bucket.count : 0,
      }));
    },

    async getAverages() {
      const result = await prisma.analysis.aggregate({
        _avg: { roi: true, score: true },
        _count: true,
      });
      return {
        averageRoi: result._avg.roi,
        averageScore: result._avg.score,
        totalAnalyzed: result._count,
      };
    },

    async getSuccessRate(userId) {
      const sold = await prisma.purchase.findMany({
        where: { userId, status: "SOLD" },
        select: { profit: true },
      });
      if (sold.length === 0) return null;
      const profitable = sold.filter((purchase) => (purchase.profit ?? 0) > 0).length;
      return (profitable / sold.length) * 100;
    },
  };
}
