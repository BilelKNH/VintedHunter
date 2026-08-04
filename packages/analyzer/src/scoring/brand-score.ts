// Weight: 15% of the overall score (§15.2 "Marque"). Same brand tiers as
// packages/crawler/src/scheduler/priority.ts conceptually, but kept as a separate table —
// crawl priority and resale desirability are different concerns even where the brand lists
// happen to overlap today.
const HIGH_VALUE_BRANDS = ['nike tech', 'stone island', "arc'teryx", 'arcteryx'];
const MID_VALUE_BRANDS = ['carhartt', 'patagonia', 'the north face', 'adidas'];

function matchesAny(value: string, candidates: string[]): boolean {
  const normalized = value.toLowerCase();
  return candidates.some((candidate) => normalized.includes(candidate));
}

export function computeBrandScore(brand: string | null): number {
  if (!brand) {
    return 20;
  }
  if (matchesAny(brand, HIGH_VALUE_BRANDS)) {
    return 95;
  }
  if (matchesAny(brand, MID_VALUE_BRANDS)) {
    return 70;
  }
  return 40;
}
