import type { ListingRecommendation } from "./listing.js";

export interface BrandCount {
  brand: string;
  count: number;
}

export interface CategoryRecommendationCount {
  category: string;
  recommendation: ListingRecommendation;
  count: number;
}

export interface DailyActivityPoint {
  date: string;
  count: number;
  averageScore: number;
}

export interface DashboardAverages {
  averageRoi: number | null;
  averageScore: number | null;
  totalAnalyzed: number;
}

// One round trip for the whole Dashboard page — mirrors PurchaseStats's "one object, several
// fields" shape (see types/purchase.ts).
export interface DashboardStats {
  brandDistribution: BrandCount[];
  categoryBreakdown: CategoryRecommendationCount[];
  dailyActivity: DailyActivityPoint[];
  averages: DashboardAverages;
  // % of SOLD purchases with profit > 0, for the authenticated user. null when nothing has
  // been sold yet — same null-when-no-data convention as PurchaseStats.averageRealizedRoi.
  successRate: number | null;
}
