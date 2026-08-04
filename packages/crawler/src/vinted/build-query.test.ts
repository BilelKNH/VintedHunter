import { describe, expect, it } from 'vitest';
import { buildVintedQuery } from './build-query.js';
import type { SearchConfiguration } from '../types.js';

function search(overrides: Partial<SearchConfiguration> = {}): SearchConfiguration {
  return {
    id: 'search-1',
    name: 'Nike Tech Fleece L',
    brands: ['Nike'],
    categories: ['Hoodie'],
    sizes: ['L'],
    keywords: ['fleece'],
    excludedKeywords: ['fake'],
    minPrice: null,
    maxPrice: null,
    ...overrides,
  };
}

describe('buildVintedQuery', () => {
  it('combines name, brands, categories and keywords into search_text', () => {
    const params = buildVintedQuery(search(), 1, 48);

    expect(params.search_text).toBe('Nike Tech Fleece L Nike Hoodie fleece');
    expect(params.page).toBe(1);
    expect(params.per_page).toBe(48);
  });

  it('deduplicates repeated terms', () => {
    const params = buildVintedQuery(
      search({ name: 'Nike', brands: ['Nike'], categories: [], keywords: [] }),
      1,
      48,
    );

    expect(params.search_text).toBe('Nike');
  });

  it('omits price_from/price_to when the search has no price bounds', () => {
    const params = buildVintedQuery(search(), 1, 48);

    expect(params.price_from).toBeUndefined();
    expect(params.price_to).toBeUndefined();
  });

  it('includes price_from and price_to when set', () => {
    const params = buildVintedQuery(search({ minPrice: 10, maxPrice: 50 }), 1, 48);

    expect(params.price_from).toBe('10');
    expect(params.price_to).toBe('50');
  });

  it('always requests newest-first ordering (required for early-stop pagination to be valid)', () => {
    const params = buildVintedQuery(search(), 1, 48);

    expect(params.order).toBe('newest_first');
  });
});
