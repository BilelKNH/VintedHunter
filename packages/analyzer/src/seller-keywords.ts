// §12.4: urgency keywords that correlate with negotiation room / margin potential.
export interface SellerKeywordSignal {
  hasUrgencySignal: boolean;
  matchedKeywords: string[];
}

const URGENCY_KEYWORDS = [
  'urgent',
  'déménagement',
  'demenagement',
  'vide dressing',
  'doit partir',
  'liquidation',
  'prix négociable',
  'prix negociable',
  'départ',
  'depart',
];

export function detectSellerKeywords(
  title: string,
  description: string | null,
): SellerKeywordSignal {
  const haystack = `${title} ${description ?? ''}`.toLowerCase();
  const matchedKeywords = URGENCY_KEYWORDS.filter((keyword) => haystack.includes(keyword));
  return { hasUrgencySignal: matchedKeywords.length > 0, matchedKeywords };
}
