// Weight: 10% of the overall score (§15.2 "Etat"). Maps Vinted's condition text (as scraped
// verbatim by the crawler — see packages/crawler/src/parser/listing-parser.ts) to a score.
// Longer/more-specific patterns are listed first since lookup is first-match-wins and e.g.
// "very good" would otherwise also match a plain "good" entry.
const CONDITION_SCORES: { pattern: string; score: number }[] = [
  { pattern: 'neuf avec étiquette', score: 100 },
  { pattern: 'new with tags', score: 100 },
  { pattern: 'neuf sans étiquette', score: 90 },
  { pattern: 'new without tags', score: 90 },
  { pattern: 'très bon état', score: 80 },
  { pattern: 'very good', score: 80 },
  { pattern: 'bon état', score: 60 },
  { pattern: 'good', score: 60 },
  { pattern: 'satisfaisant', score: 35 },
  { pattern: 'satisfactory', score: 35 },
];

const DEFAULT_CONDITION_SCORE = 50;

export function computeConditionScore(condition: string | null): number {
  if (!condition) {
    return DEFAULT_CONDITION_SCORE;
  }
  const normalized = condition.trim().toLowerCase();
  const match = CONDITION_SCORES.find((entry) => normalized.includes(entry.pattern));
  return match?.score ?? DEFAULT_CONDITION_SCORE;
}
