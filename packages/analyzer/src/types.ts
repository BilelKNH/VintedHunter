export interface SellerInfo {
  rating: number | null;
  reviews: number | null;
  accountAge: number | null;
  totalListings: number | null;
  riskScore: number | null;
}

export interface ListingForAnalysis {
  title: string;
  description: string | null;
  brand: string | null;
  category: string | null;
  size: string | null;
  condition: string | null;
  price: number;
  currency: string;
  seller: SellerInfo | null;
}

export interface MarketContext {
  estimatedValue: number;
  comparableCount: number;
}

export interface AnalysisInput {
  listing: ListingForAnalysis;
  market: MarketContext;
}

export type Recommendation = 'IGNORE' | 'WATCH' | 'GOOD_OPPORTUNITY' | 'STRONG_BUY';

// Mirrors packages/database's Analysis model (score/priceScore/.../authenticityScore are Int
// columns, estimatedValue/estimatedProfit/roi are Float) — see the plan's weight-redistribution
// note for why there are only 5 sub-scores instead of SPECIFICATION.md §15.2's 8 criteria.
export interface AnalysisResult {
  score: number;
  priceScore: number;
  brandScore: number;
  conditionScore: number;
  liquidityScore: number;
  authenticityScore: number;
  estimatedValue: number;
  estimatedProfit: number;
  roi: number; // percentage, e.g. 150 means +150% — matches §47's "ROI > 100%" literally
  recommendation: Recommendation;
  explanation: string[];
}
