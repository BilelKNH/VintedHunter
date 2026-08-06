// Weight: 10% of the overall score — more comparable listings for the same item means more
// competition for a buyer trying to flip it. Zero comparables is deliberately NOT treated as
// "zero competition": it usually just means thin data (a rare brand/category, or no embedding
// yet), not a genuinely uncontested market, so it starts at the same neutral baseline as every
// other thin-data sub-score (see trend-score.ts, season-score.ts).
const NEUTRAL_SCORE = 60;
const PENALTY_PER_COMPARABLE = 5;
const MAX_PENALTY = 50;

export function computeCompetitionScore(comparableCount: number): number {
  if (comparableCount === 0) {
    return NEUTRAL_SCORE;
  }
  const penalty = Math.min(comparableCount * PENALTY_PER_COMPARABLE, MAX_PENALTY);
  return Math.max(0, NEUTRAL_SCORE - penalty);
}
