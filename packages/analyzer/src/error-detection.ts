// §12.5: catches likely brand-name typos when the crawler couldn't confidently attach a brand
// (e.g. "Nik hoodie noir L" → probable "Nike"). Only runs when knownBrand is null — a
// confidently-known brand field is trusted over a fuzzy title guess.
export interface ErrorDetectionResult {
  suggestedBrandCorrection: string | null;
}

// Single-word brand names only — the word-by-word scan below can't meaningfully fuzzy-match a
// multi-word brand ("stone island", "the north face") against one title token.
const KNOWN_BRANDS = ['nike', 'carhartt', 'patagonia', 'adidas'];

const MAX_CORRECTION_DISTANCE = 2;

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = [];

  for (let i = 0; i < rows; i += 1) {
    dp.push(new Array<number>(cols).fill(0));
    dp[i]![0] = i;
  }
  for (let j = 0; j < cols; j += 1) {
    dp[0]![j] = j;
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + cost);
    }
  }

  return dp[rows - 1]![cols - 1]!;
}

export function detectTitleErrors(title: string, knownBrand: string | null): ErrorDetectionResult {
  if (knownBrand) {
    return { suggestedBrandCorrection: null };
  }

  const words = title.toLowerCase().split(/\s+/).filter(Boolean);
  for (const word of words) {
    if (word.length < 3) {
      continue;
    }
    for (const brand of KNOWN_BRANDS) {
      if (word === brand) {
        continue;
      }
      const distance = levenshtein(word, brand);
      const lengthGap = Math.abs(word.length - brand.length);
      if (
        distance > 0 &&
        distance <= MAX_CORRECTION_DISTANCE &&
        lengthGap <= MAX_CORRECTION_DISTANCE
      ) {
        return { suggestedBrandCorrection: brand };
      }
    }
  }

  return { suggestedBrandCorrection: null };
}
