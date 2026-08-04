export interface ComparableListing {
  price: number;
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
  comparableCount: number;
  averageComparablePrice: number | null;
  brandFactor: number;
  conditionFactor: number;
  demandFactor: number;
}
