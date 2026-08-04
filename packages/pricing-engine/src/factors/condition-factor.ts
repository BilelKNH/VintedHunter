// Signed € adjustment relative to the base (average comparable) price — condition tiers mirror
// packages/analyzer's condition scoring, expressed here as a % delta on the base price rather
// than an absolute score.
const CONDITION_ADJUSTMENT_PCT: { pattern: string; pct: number }[] = [
  { pattern: 'neuf avec étiquette', pct: 0.15 },
  { pattern: 'new with tags', pct: 0.15 },
  { pattern: 'neuf sans étiquette', pct: 0.08 },
  { pattern: 'new without tags', pct: 0.08 },
  { pattern: 'très bon état', pct: 0 },
  { pattern: 'very good', pct: 0 },
  { pattern: 'bon état', pct: -0.1 },
  { pattern: 'good', pct: -0.1 },
  { pattern: 'satisfaisant', pct: -0.25 },
  { pattern: 'satisfactory', pct: -0.25 },
];

export function computeConditionFactor(condition: string | null, basePrice: number): number {
  if (!condition || basePrice <= 0) {
    return 0;
  }
  const normalized = condition.trim().toLowerCase();
  const match = CONDITION_ADJUSTMENT_PCT.find((entry) => normalized.includes(entry.pattern));
  const pct = match?.pct ?? 0;
  return Math.round(basePrice * pct);
}
