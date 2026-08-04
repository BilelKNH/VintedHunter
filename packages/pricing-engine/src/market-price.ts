import { computeBrandFactor } from './factors/brand-factor.js';
import { computeConditionFactor } from './factors/condition-factor.js';
import { computeDemandFactor } from './factors/demand-factor.js';
import type { ComparableListing, MarketPriceContext, MarketPriceEstimate } from './types.js';

// §24, literally: MarketPrice = Average Similar Listings + Brand Factor + Condition Factor +
// Demand Factor. "Similar listings" are found by the caller (apps/worker's
// comparable-listings.repository.ts, matching by brand/category/size against Postgres — no
// embeddings/vector similarity yet, that's Phase 6's §59-60).
export function estimateMarketPrice(
  comparables: ComparableListing[],
  context: MarketPriceContext,
): MarketPriceEstimate {
  const comparableCount = comparables.length;

  if (comparableCount === 0) {
    // No independent market data at all — return the listing's own price verbatim rather than
    // applying brand/condition/demand factors derived from the listing's own self-reported
    // attributes. Those attributes are scraped verbatim from Vinted (unverified), so adjusting
    // off them here would fabricate a "discount" that looks market-corroborated to
    // priceScore (35% weight) when it's really just the listing agreeing with itself.
    return {
      estimatedValue: Math.max(0, Math.round(context.fallbackPrice)),
      comparableCount: 0,
      averageComparablePrice: null,
      brandFactor: 0,
      conditionFactor: 0,
      demandFactor: 0,
    };
  }

  const basePrice =
    comparables.reduce((sum, comparable) => sum + comparable.price, 0) / comparableCount;
  const brandFactor = computeBrandFactor(context.brand);
  const conditionFactor = computeConditionFactor(context.condition, basePrice);
  const demandFactor = computeDemandFactor(comparableCount, basePrice);

  const estimatedValue = Math.max(
    0,
    Math.round(basePrice + brandFactor + conditionFactor + demandFactor),
  );

  return {
    estimatedValue,
    comparableCount,
    averageComparablePrice: basePrice,
    brandFactor,
    conditionFactor,
    demandFactor,
  };
}
