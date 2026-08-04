import { computeBrandScore } from './brand-score.js';

// Weight: 30% of the overall score — §15.2's "Demande produit" (20%) folded in here alongside
// "Liquidité" (10%), since there's no separate demandScore column on the Analysis model (see
// the plan's scoring-weights note). Brand desirability is used as a demand proxy, plus a small
// bonus for how many comparable listings the pricing engine found (a live market has more
// comparables — this isn't a full sold-listings signal since none is tracked yet).
const ACTIVITY_BONUS_PER_COMPARABLE = 5;
const MAX_ACTIVITY_BONUS = 30;
const BRAND_WEIGHT = 0.7;

export function computeLiquidityScore(brand: string | null, comparableCount: number): number {
  const brandComponent = computeBrandScore(brand);
  const activityBonus = Math.min(
    comparableCount * ACTIVITY_BONUS_PER_COMPARABLE,
    MAX_ACTIVITY_BONUS,
  );
  const score = brandComponent * BRAND_WEIGHT + activityBonus;
  return Math.max(0, Math.min(100, Math.round(score)));
}
