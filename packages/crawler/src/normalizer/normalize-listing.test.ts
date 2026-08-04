import { describe, expect, it } from 'vitest';
import { normalizeListing } from './normalize-listing.js';
import type { ParsedListing } from '../parser/listing-parser.js';
import type { SearchConfiguration } from '../types.js';

const parsed: ParsedListing = {
  externalId: '123',
  title: '  Nike Tech Fleece Hoodie  ',
  brand: ' Nike ',
  size: ' L ',
  condition: ' Very good ',
  price: 35,
  currency: 'EUR',
  url: 'https://www.vinted.fr/items/123',
  images: ['https://images.vinted.net/1.jpg'],
  seller: { externalId: '789', username: 'seller1', rating: 4.8, reviews: 120 },
  publishedAt: '2024-01-01T00:00:00.000Z',
};

const search: SearchConfiguration = {
  id: 'search-1',
  name: 'Nike Tech Fleece',
  brands: ['Nike'],
  categories: ['Hoodie', 'Sweat'],
  sizes: ['L'],
  keywords: [],
  excludedKeywords: [],
  minPrice: null,
  maxPrice: null,
};

describe('normalizeListing', () => {
  it('trims whitespace from string fields', () => {
    const normalized = normalizeListing(parsed, search);

    expect(normalized.title).toBe('Nike Tech Fleece Hoodie');
    expect(normalized.brand).toBe('Nike');
    expect(normalized.size).toBe('L');
    expect(normalized.condition).toBe('Very good');
  });

  it("guesses the category from the title against the search's categories", () => {
    const normalized = normalizeListing(parsed, search);

    expect(normalized.category).toBe('Hoodie');
  });

  it('leaves category null when nothing in the title matches', () => {
    const normalized = normalizeListing(parsed, { ...search, categories: ['Jeans'] });

    expect(normalized.category).toBeNull();
  });

  it("sets description to null (catalog endpoint doesn't return one)", () => {
    const normalized = normalizeListing(parsed, search);

    expect(normalized.description).toBeNull();
  });

  it('produces a stable content hash for identical title/price/description', () => {
    const a = normalizeListing(parsed, search);
    const b = normalizeListing(parsed, search);

    expect(a.contentHash).toBe(b.contentHash);
  });

  it('produces a different content hash when the price changes', () => {
    const a = normalizeListing(parsed, search);
    const b = normalizeListing({ ...parsed, price: 40 }, search);

    expect(a.contentHash).not.toBe(b.contentHash);
  });

  it('passes through seller and images unchanged', () => {
    const normalized = normalizeListing(parsed, search);

    expect(normalized.seller).toEqual(parsed.seller);
    expect(normalized.images).toEqual(parsed.images);
  });
});
