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
  // Passthrough from @vinted-hunter/pricing-engine's MarketPriceEstimate — see
  // packages/pricing-engine/src/factors/confidence.ts. Not used in scoring itself, just carried
  // through to AnalysisResult for persistence/display.
  estimatedValueLow: number;
  estimatedValueHigh: number;
  confidence: number;
}

// Phase 6: real image-derived signals from packages/ai-engine's Claude Vision analysis.
// Deliberately decoupled from @vinted-hunter/ai-engine's VisionAnalysisResult type (same
// shape, no cross-package dependency) — packages/analyzer stays pure/DB-and-API-agnostic.
export interface VisionSignals {
  photoQualityScore: number | null;
  defects: string[];
  extractedLabelText: string[];
  brandLogoConsistent: boolean | null;
  counterfeitRiskFlags: string[];
}

export interface AnalysisInput {
  listing: ListingForAnalysis;
  market: MarketContext;
  // Absent/null when vision analysis wasn't run (no images, no API key, or it failed) —
  // computeAnalysis behaves identically to before Phase 6 in that case.
  vision?: VisionSignals | null;
  // Percentage margin maxBuyPrice must clear against market.estimatedValue — mirrors the
  // triggering Search's targetRoi (see packages/database's Search model).
  targetRoi: number;
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
  estimatedValueLow: number;
  estimatedValueHigh: number;
  confidence: number;
  estimatedProfit: number;
  roi: number; // percentage, e.g. 150 means +150% — matches §47's "ROI > 100%" literally
  // Highest price to pay so a resale at estimatedValue still clears targetRoi.
  maxBuyPrice: number;
  recommendation: Recommendation;
  explanation: string[];
  // Phase 6: vision fields, defaulted to null/[] when vision analysis wasn't run — mirrors the
  // new nullable columns on the Analysis model.
  photoQualityScore: number | null;
  defects: string[];
  extractedLabelText: string[];
  brandLogoConsistent: boolean | null;
  counterfeitRiskFlags: string[];
}
