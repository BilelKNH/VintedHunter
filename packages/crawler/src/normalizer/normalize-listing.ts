import { createHash } from 'node:crypto';
import type { ParsedListing } from '../parser/listing-parser.js';
import type { CrawledListing, SearchConfiguration } from '../types.js';

// Best-effort: Vinted's catalog item JSON only exposes a numeric catalog_id (no taxonomy
// mapping in V1 — see plan assumption #3), so category is guessed from whichever of the
// search's configured categories appears in the title, same idea as matching/matches-search.ts.
function guessCategory(title: string, categories: string[]): string | null {
  const lowerTitle = title.toLowerCase();
  return categories.find((category) => lowerTitle.includes(category.toLowerCase())) ?? null;
}

function computeContentHash(input: {
  title: string;
  price: number;
  description: string | null;
}): string {
  return createHash('sha256')
    .update(`${input.title}|${input.price}|${input.description ?? ''}`)
    .digest('hex');
}

export function normalizeListing(
  parsed: ParsedListing,
  search: SearchConfiguration,
): CrawledListing {
  const description = null;

  return {
    externalId: parsed.externalId,
    source: 'VINTED',
    title: parsed.title.trim(),
    description,
    brand: parsed.brand?.trim() ?? null,
    category: guessCategory(parsed.title, search.categories),
    size: parsed.size?.trim() ?? null,
    condition: parsed.condition?.trim() ?? null,
    price: parsed.price,
    currency: parsed.currency,
    url: parsed.url,
    images: parsed.images,
    seller: parsed.seller,
    publishedAt: parsed.publishedAt,
    contentHash: computeContentHash({ title: parsed.title, price: parsed.price, description }),
  };
}
