export type ComparableSource = 'internal' | 'manual';

export interface ComparableListing {
  price: number;
  // 'internal' — another Vinted listing found similar (by embedding or brand/category, see
  // apps/worker's comparable-listings.repository.ts). 'manual' — a price a user recorded for
  // this exact item on another platform (ManualComparable). See factors/source-weight.ts.
  source: ComparableSource;
  // ISO date the comparable was observed — feeds factors/recency-factor.ts.
  observedAt: string;
}

export interface MarketPriceContext {
  brand: string | null;
  condition: string | null;
  // Used verbatim (no brand/condition/demand adjustment) as the estimate when there are no
  // comparables at all — can't estimate a market value without any independent market data, so
  // this is a true net-zero signal for the analyzer's price score rather than a fabricated
  // discount derived from the listing's own unverified claims.
  fallbackPrice: number;
}

export interface MarketPriceEstimate {
  estimatedValue: number;
  // Weighted-stddev interval around estimatedValue — collapses to a point (low = high =
  // estimatedValue) with zero or one comparable, since there's no spread to measure.
  estimatedValueLow: number;
  estimatedValueHigh: number;
  // 0-100, see factors/confidence.ts.
  confidence: number;
  comparableCount: number;
  averageComparablePrice: number | null;
  brandFactor: number;
  conditionFactor: number;
  demandFactor: number;
}
