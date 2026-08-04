// §12.3: flags under-optimized descriptions (too short, or just generic phrases with nothing
// else) — these tend to get less visibility on Vinted and are more likely to be under-priced.
export interface DescriptionQuality {
  isLowQuality: boolean;
  reasons: string[];
}

const GENERIC_PHRASES = [
  'bon état',
  'bon etat',
  'good condition',
  'comme neuf',
  'like new',
  'taille l',
  'taille m',
  'taille s',
];

const MIN_QUALITY_LENGTH = 40;
const GENERIC_ONLY_LENGTH_CEILING = 80;

export function analyzeDescriptionQuality(description: string | null): DescriptionQuality {
  const reasons: string[] = [];

  if (!description || description.trim().length === 0) {
    return { isLowQuality: true, reasons: ['Aucune description'] };
  }

  const trimmed = description.trim();
  if (trimmed.length < MIN_QUALITY_LENGTH) {
    reasons.push('Description très courte');
  }

  const normalized = trimmed.toLowerCase();
  const hasGenericPhrase = GENERIC_PHRASES.some((phrase) => normalized.includes(phrase));
  if (hasGenericPhrase && trimmed.length < GENERIC_ONLY_LENGTH_CEILING) {
    reasons.push('Description générique');
  }

  return { isLowQuality: reasons.length > 0, reasons };
}
