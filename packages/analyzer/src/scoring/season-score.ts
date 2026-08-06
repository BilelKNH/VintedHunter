// Weight: 5% of the overall score — hand-authored keyword table, same substring-match style as
// pricing-engine's factors/brand-factor.ts. Vinted categories are free text (crawler's
// guessCategory does substring matching too, no fixed taxonomy), so this stays a small,
// maintainable list rather than trying to be exhaustive.
interface SeasonalCategory {
  keywords: string[];
  activeMonths: number[]; // 1-12
}

const SEASONAL_CATEGORIES: SeasonalCategory[] = [
  {
    keywords: ['manteau', 'doudoune', 'coat', 'jacket', 'parka', 'pull', 'sweater', 'écharpe', 'scarf'],
    activeMonths: [9, 10, 11, 12, 1, 2],
  },
  {
    keywords: ['maillot de bain', 'swimwear', 'short', 'sandale', 'sandal', 'débardeur', 'tank top'],
    activeMonths: [4, 5, 6, 7, 8],
  },
];

const NEUTRAL_SCORE = 50;
const IN_SEASON_BONUS = 20;
const OUT_OF_SEASON_PENALTY = 20;

export function computeSeasonScore(category: string | null, now: Date = new Date()): number {
  if (!category) {
    return NEUTRAL_SCORE;
  }
  const normalized = category.toLowerCase();
  const match = SEASONAL_CATEGORIES.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );
  if (!match) {
    return NEUTRAL_SCORE;
  }
  const month = now.getMonth() + 1;
  return match.activeMonths.includes(month)
    ? NEUTRAL_SCORE + IN_SEASON_BONUS
    : NEUTRAL_SCORE - OUT_OF_SEASON_PENALTY;
}
