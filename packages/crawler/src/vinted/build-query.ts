import type { SearchConfiguration } from '../types.js';

export interface VintedQueryParams {
  search_text: string;
  page: number;
  per_page: number;
  order: string;
  price_from?: string;
  price_to?: string;
}

// Vinted's real catalog filters need numeric brand/category IDs we don't have a taxonomy for
// (see packages/crawler README / plan assumption #3) — so V1 queries broadly by free text and
// relies on matching/matches-search.ts to filter precisely once results come back.
//
// `order` is pinned to newest-first (not just Vinted's default) because the crawl-search job's
// early-stop pagination (apps/worker/src/jobs/crawl-search.job.ts) assumes "this page had no
// new externalIds" means "later pages won't either" — that assumption only holds when results
// are strictly newest-first; any relevance-ranked default would make it silently miss listings.
const NEWEST_FIRST_ORDER = 'newest_first';

export function buildVintedQuery(
  search: SearchConfiguration,
  page: number,
  perPage: number,
): VintedQueryParams {
  const terms = [search.name, ...search.brands, ...search.categories, ...search.keywords]
    .map((term) => term.trim())
    .filter((term) => term.length > 0);

  const params: VintedQueryParams = {
    search_text: [...new Set(terms)].join(' '),
    page,
    per_page: perPage,
    order: NEWEST_FIRST_ORDER,
  };

  if (search.minPrice != null) {
    params.price_from = String(search.minPrice);
  }
  if (search.maxPrice != null) {
    params.price_to = String(search.maxPrice);
  }

  return params;
}
