import { computeBrandFactor } from './factors/brand-factor.js';
import { computeConditionFactor } from './factors/condition-factor.js';
import { computeDemandFactor } from './factors/demand-factor.js';
import { computeConfidence } from './factors/confidence.js';
import { computeRecencyWeight } from './factors/recency-factor.js';
import { weightForSource } from './factors/source-weight.js';
import type { ComparableListing, MarketPriceContext, MarketPriceEstimate } from './types.js';

interface WeightedComparable {
  price: number;
  weight: number;
}

function weighComparables(comparables: ComparableListing[]): WeightedComparable[] {
  return comparables.map((comparable) => ({
    price: comparable.price,
    weight: weightForSource(comparable.source) * computeRecencyWeight(comparable.observedAt),
  }));
}

// Weighted mean — replaces the plain average so a direct external observation (source: 'manual')
// and a fresher comparable both count for more than an old, merely-similar internal listing.
function weightedAverage(weighted: WeightedComparable[]): { basePrice: number; totalWeight: number } {
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  const weightedSum = weighted.reduce((sum, item) => sum + item.price * item.weight, 0);
  return { basePrice: weightedSum / totalWeight, totalWeight };
}

// Weighted standard deviation around basePrice — the spread comparables actually show, not an
// arbitrary percentage, so the interval widens/narrows honestly with how much they agree.
function weightedStdDev(weighted: WeightedComparable[], basePrice: number, totalWeight: number): number {
  const weightedVariance =
    weighted.reduce((sum, item) => sum + item.weight * (item.price - basePrice) ** 2, 0) /
    totalWeight;
  return Math.sqrt(weightedVariance);
}

// §24, extended: MarketPrice = Weighted Average Comparables (by source reliability + recency) +
// Brand Factor + Condition Factor + Demand Factor. "Comparables" come from two sources fed by the
// caller (apps/worker's comparable-listings.repository.ts): other Vinted listings matched by
// embedding similarity ('internal'), and prices a user recorded for this exact item elsewhere
// ('manual', ManualComparable). See factors/source-weight.ts and factors/recency-factor.ts.
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
    const fallback = Math.max(0, Math.round(context.fallbackPrice));
    return {
      estimatedValue: fallback,
      estimatedValueLow: fallback,
      estimatedValueHigh: fallback,
      confidence: 0,
      comparableCount: 0,
      averageComparablePrice: null,
      brandFactor: 0,
      conditionFactor: 0,
      demandFactor: 0,
    };
  }

  const weighted = weighComparables(comparables);
  const { basePrice, totalWeight } = weightedAverage(weighted);
  const stdDev = weightedStdDev(weighted, basePrice, totalWeight);

  const brandFactor = computeBrandFactor(context.brand);
  const conditionFactor = computeConditionFactor(context.condition, basePrice);
  const demandFactor = computeDemandFactor(comparableCount, basePrice);

  const estimatedValue = Math.max(
    0,
    Math.round(basePrice + brandFactor + conditionFactor + demandFactor),
  );
  const confidence = computeConfidence({
    comparableCount,
    hasManualSource: comparables.some((comparable) => comparable.source === 'manual'),
    coefficientOfVariation: basePrice > 0 ? stdDev / basePrice : 0,
  });

  return {
    estimatedValue,
    estimatedValueLow: Math.max(0, Math.round(estimatedValue - stdDev)),
    estimatedValueHigh: Math.round(estimatedValue + stdDev),
    confidence,
    comparableCount,
    averageComparablePrice: basePrice,
    brandFactor,
    conditionFactor,
    demandFactor,
  };
}
