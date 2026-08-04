// Signed € adjustment for desirable brands — same tiers as packages/analyzer's brand scoring,
// kept separate since this package doesn't depend on @vinted-hunter/analyzer (pricing and
// scoring are independent concerns that happen to use similar brand tiers).
const HIGH_VALUE_BRANDS = ['nike tech', 'stone island', "arc'teryx", 'arcteryx'];
const MID_VALUE_BRANDS = ['carhartt', 'patagonia', 'the north face', 'adidas'];

const HIGH_VALUE_BONUS = 15;
const MID_VALUE_BONUS = 5;

export function computeBrandFactor(brand: string | null): number {
  if (!brand) {
    return 0;
  }
  const normalized = brand.toLowerCase();
  if (HIGH_VALUE_BRANDS.some((candidate) => normalized.includes(candidate))) {
    return HIGH_VALUE_BONUS;
  }
  if (MID_VALUE_BRANDS.some((candidate) => normalized.includes(candidate))) {
    return MID_VALUE_BONUS;
  }
  return 0;
}
