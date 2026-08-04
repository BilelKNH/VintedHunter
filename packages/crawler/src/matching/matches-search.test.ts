import { describe, expect, it } from 'vitest';
import { matchesSearchCriteria } from './matches-search.js';
import type { CrawledListing, SearchConfiguration } from '../types.js';

function listing(overrides: Partial<CrawledListing> = {}): CrawledListing {
  return {
    externalId: '1',
    source: 'VINTED',
    title: 'Nike Tech Fleece Hoodie',
    description: null,
    brand: 'Nike',
    category: null,
    size: 'L',
    condition: 'Very good',
    price: 35,
    currency: 'EUR',
    url: 'https://vinted.fr/items/1',
    images: [],
    seller: null,
    publishedAt: null,
    contentHash: 'hash',
    ...overrides,
  };
}

function search(overrides: Partial<SearchConfiguration> = {}): SearchConfiguration {
  return {
    id: 'search-1',
    name: 'Nike Tech Fleece',
    brands: [],
    categories: [],
    sizes: [],
    keywords: [],
    excludedKeywords: [],
    minPrice: null,
    maxPrice: null,
    ...overrides,
  };
}

describe('matchesSearchCriteria', () => {
  it('matches when there are no constraints', () => {
    expect(matchesSearchCriteria(listing(), search())).toBe(true);
  });

  it('rejects a listing below minPrice', () => {
    expect(matchesSearchCriteria(listing({ price: 5 }), search({ minPrice: 10 }))).toBe(false);
  });

  it('rejects a listing above maxPrice', () => {
    expect(matchesSearchCriteria(listing({ price: 100 }), search({ maxPrice: 50 }))).toBe(false);
  });

  it('rejects a listing containing an excluded keyword in the title', () => {
    expect(
      matchesSearchCriteria(
        listing({ title: 'Fake Nike Tech Fleece' }),
        search({ excludedKeywords: ['fake'] }),
      ),
    ).toBe(false);
  });

  it("rejects a listing whose brand isn't in the allowlist", () => {
    expect(matchesSearchCriteria(listing({ brand: 'Adidas' }), search({ brands: ['Nike'] }))).toBe(
      false,
    );
  });

  it('accepts a listing matching the brand via title when brand field is null', () => {
    expect(
      matchesSearchCriteria(
        listing({ brand: null, title: 'Nike Tech Fleece Hoodie' }),
        search({ brands: ['Nike'] }),
      ),
    ).toBe(true);
  });

  it("rejects a listing whose size isn't in the allowlist", () => {
    expect(matchesSearchCriteria(listing({ size: 'M' }), search({ sizes: ['L'] }))).toBe(false);
  });

  it('rejects a listing with a null size when sizes are required', () => {
    expect(matchesSearchCriteria(listing({ size: null }), search({ sizes: ['L'] }))).toBe(false);
  });

  it('rejects a listing matching none of the required keywords', () => {
    expect(matchesSearchCriteria(listing(), search({ keywords: ['vintage'] }))).toBe(false);
  });

  it('accepts a listing matching at least one required keyword', () => {
    expect(matchesSearchCriteria(listing(), search({ keywords: ['fleece'] }))).toBe(true);
  });
});
