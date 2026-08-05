import type { Marketplace } from "../marketplace.js";

// Mirrors @vinted-hunter/analyzer's Recommendation — duplicated rather than imported so this
// foundational package stays a dependency-free leaf (see packages/analyzer's own zero inbound
// deps from its siblings).
export type ListingRecommendation = "IGNORE" | "WATCH" | "GOOD_OPPORTUNITY" | "STRONG_BUY";

export interface ListingAnalysisSummary {
  score: number;
  recommendation: ListingRecommendation;
  // Highest price to pay for a resale at estimatedValue to still clear the triggering search's
  // target ROI (see packages/analyzer's compute-score.ts).
  maxBuyPrice: number;
}

// Mirrors the Prisma Listing model as it's actually shaped over the wire — date fields are
// ISO strings here (JSON has no Date type), not the Date objects Prisma returns server-side.
export interface Listing {
  id: string;
  externalId: string;
  source: Marketplace;
  title: string;
  description: string | null;
  brand: string | null;
  category: string | null;
  size: string | null;
  condition: string | null;
  price: number;
  currency: string;
  url: string;
  images: string[];
  sellerId: string | null;
  publishedAt: string | null;
  createdAt: string;
  // null until the analyze-listing job has scored this listing (see apps/worker).
  analysis: ListingAnalysisSummary | null;
}
