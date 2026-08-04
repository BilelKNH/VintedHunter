// §11.6: High (Nike Tech, Stone Island, Arc'Teryx), Medium (Carhartt, Patagonia), Low (everything else).
// Lower number = higher priority, matching BullMQ's job `priority` option.
export const CRAWL_PRIORITY = {
  HIGH: 1,
  MEDIUM: 5,
  LOW: 10,
} as const;

const HIGH_PRIORITY_BRANDS = ['nike tech', 'stone island', "arc'teryx", 'arcteryx'];
const MEDIUM_PRIORITY_BRANDS = ['carhartt', 'patagonia'];

function matchesAny(brand: string, candidates: string[]): boolean {
  const normalized = brand.trim().toLowerCase();
  return candidates.some((candidate) => normalized.includes(candidate));
}

export function priorityForBrands(brands: string[]): number {
  if (brands.some((brand) => matchesAny(brand, HIGH_PRIORITY_BRANDS))) {
    return CRAWL_PRIORITY.HIGH;
  }
  if (brands.some((brand) => matchesAny(brand, MEDIUM_PRIORITY_BRANDS))) {
    return CRAWL_PRIORITY.MEDIUM;
  }
  return CRAWL_PRIORITY.LOW;
}
