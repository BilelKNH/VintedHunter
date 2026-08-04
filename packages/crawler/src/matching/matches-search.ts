import type { CrawledListing, SearchConfiguration } from '../types.js';

function includesCaseInsensitive(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

// V1's search is broad (build-query.ts), so this predicate is what actually enforces a
// search's criteria before a listing gets persisted — price range, excluded keywords, and
// (when configured) brand/size/keyword allowlists.
export function matchesSearchCriteria(
  listing: CrawledListing,
  search: SearchConfiguration,
): boolean {
  if (search.minPrice != null && listing.price < search.minPrice) {
    return false;
  }
  if (search.maxPrice != null && listing.price > search.maxPrice) {
    return false;
  }

  const haystack = `${listing.title} ${listing.brand ?? ''}`;

  if (search.excludedKeywords.some((keyword) => includesCaseInsensitive(haystack, keyword))) {
    return false;
  }

  if (search.brands.length > 0) {
    // Trust the parsed brand field when Vinted gave us one — only fall back to scanning the
    // title when it didn't, so a listing explicitly tagged with a different brand can't slip
    // through just because the search's brand name happens to appear in the title too.
    const brandMatches =
      listing.brand != null
        ? search.brands.some((brand) => includesCaseInsensitive(listing.brand ?? '', brand))
        : search.brands.some((brand) => includesCaseInsensitive(listing.title, brand));
    if (!brandMatches) {
      return false;
    }
  }

  if (search.sizes.length > 0) {
    const sizeMatches =
      listing.size != null &&
      search.sizes.some((size) => includesCaseInsensitive(listing.size ?? '', size));
    if (!sizeMatches) {
      return false;
    }
  }

  if (search.keywords.length > 0) {
    const keywordMatches = search.keywords.some((keyword) =>
      includesCaseInsensitive(haystack, keyword),
    );
    if (!keywordMatches) {
      return false;
    }
  }

  return true;
}
