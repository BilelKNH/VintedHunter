// Weight: 35% of the overall score (§15.2's "Prix sous marché" 30% + "Photos" 5% redistributed
// here — see the plan's scoring-weights note, no vision analysis exists yet to score photos).
export function computePriceScore(price: number, estimatedValue: number): number {
  if (estimatedValue <= 0) {
    return 0;
  }
  const discount = (estimatedValue - price) / estimatedValue;
  // 0% discount -> 50 (neutral), fully-discounted-or-more -> 100, overpriced -> toward 0.
  const score = 50 + discount * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
}
