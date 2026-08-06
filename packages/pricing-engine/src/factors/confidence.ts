export interface ConfidenceInput {
  comparableCount: number;
  hasManualSource: boolean;
  // stddev / basePrice — 0 when there's only one comparable (no spread to measure).
  coefficientOfVariation: number;
}

// Starting point when there's at least one comparable but nothing else going for it (a single,
// undated internal match) — deliberately well below the §47 notification-relevant range, since
// one weak comparable shouldn't read as a confident estimate.
const BASE_CONFIDENCE = 30;
const PER_COMPARABLE_BONUS = 6;
const MAX_COUNT_BONUS = 40;
// A direct external observation for the exact item is worth more than another handful of
// internal comparables — see source-weight.ts's same rationale.
const MANUAL_SOURCE_BONUS = 15;
const MAX_DISPERSION_PENALTY = 35;

export function computeConfidence({
  comparableCount,
  hasManualSource,
  coefficientOfVariation,
}: ConfidenceInput): number {
  const countBonus = Math.min(comparableCount * PER_COMPARABLE_BONUS, MAX_COUNT_BONUS);
  const sourceBonus = hasManualSource ? MANUAL_SOURCE_BONUS : 0;
  const dispersionPenalty = Math.min(coefficientOfVariation * 100, MAX_DISPERSION_PENALTY);

  const score = BASE_CONFIDENCE + countBonus + sourceBonus - dispersionPenalty;
  return Math.max(0, Math.min(100, Math.round(score)));
}
