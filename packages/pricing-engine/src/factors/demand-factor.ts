// Signed € adjustment based on how many comparable listings exist — more comparables found is a
// (crude) proxy for an active market for this brand/category, since no sold-listings signal is
// tracked yet.
const PCT_PER_COMPARABLE = 0.02;
const MAX_DEMAND_PCT = 0.1;

export function computeDemandFactor(comparableCount: number, basePrice: number): number {
  if (basePrice <= 0) {
    return 0;
  }
  const pct = Math.min(comparableCount * PCT_PER_COMPARABLE, MAX_DEMAND_PCT);
  return Math.round(basePrice * pct);
}
