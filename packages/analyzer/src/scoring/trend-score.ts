// Weight: 5% of the overall score — a low weight is deliberate: PriceHistory is written on every
// price change (apps/worker's crawl-listings.repository.ts) but essentially never read until
// now, so most listings will have an empty history for a while and score neutral. This is the
// price-data equivalent of packages/analyzer's seller-keywords.ts hasUrgencySignal (text-based
// "vendeur pressé" detection) — a real price cut is a stronger version of the same signal.
const NEUTRAL_SCORE = 50;
const PRICE_CUT_BONUS = 15;

// priceHistory: this listing's own past prices, oldest -> newest.
export function computeTrendScore(priceHistory: number[], currentPrice: number): number {
  if (priceHistory.length === 0) {
    return NEUTRAL_SCORE;
  }
  const earliestPrice = priceHistory[0] as number;
  if (currentPrice < earliestPrice) {
    return Math.min(100, NEUTRAL_SCORE + PRICE_CUT_BONUS);
  }
  return NEUTRAL_SCORE;
}
