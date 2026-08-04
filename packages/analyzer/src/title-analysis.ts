// §12.2: lightweight brand/collection extraction from the title — not a full NLP model, just a
// small curated hint table for the resale-relevant brands this project actually cares about
// (same brands as packages/crawler's priority list).
export interface TitleAnalysis {
  detectedBrand: string | null;
  probableCollection: string | null;
  confidence: number;
}

const COLLECTION_HINTS: Record<string, { keyword: string; collection: string }[]> = {
  nike: [{ keyword: 'tech', collection: 'Tech Fleece' }],
  'stone island': [{ keyword: 'shadow', collection: 'Shadow Project' }],
  "arc'teryx": [{ keyword: 'beta', collection: 'Beta' }],
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function analyzeTitle(title: string, knownBrand: string | null): TitleAnalysis {
  const normalizedTitle = normalize(title);
  let confidence = 30; // baseline: we at least have a title to work with
  let probableCollection: string | null = null;

  if (knownBrand) {
    confidence += 30;
    const hints = COLLECTION_HINTS[normalize(knownBrand)] ?? [];
    const hit = hints.find((hint) => normalizedTitle.includes(hint.keyword));
    if (hit) {
      probableCollection = hit.collection;
      confidence += 25;
    }
  }

  if (normalizedTitle.split(/\s+/).filter(Boolean).length >= 3) {
    confidence += 15;
  }

  return { detectedBrand: knownBrand, probableCollection, confidence: Math.min(confidence, 100) };
}
