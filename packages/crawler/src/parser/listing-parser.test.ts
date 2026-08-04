import { describe, expect, it } from 'vitest';
import { parseListing } from './listing-parser.js';

function rawItem(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 123456,
    title: 'Nike Tech Fleece Hoodie',
    url: 'https://www.vinted.fr/items/123456',
    total_item_price: { amount: '35.00', currency_code: 'EUR' },
    brand_title: 'Nike',
    size_title: 'L',
    status: 'Very good',
    photos: [{ url: 'https://images.vinted.net/1.jpg' }],
    user: { id: 789, login: 'seller1', feedback_reputation: 4.8, feedback_count: 120 },
    created_at_ts: 1_700_000_000,
    ...overrides,
  };
}

describe('parseListing', () => {
  it('parses a well-formed Vinted catalog item', () => {
    const parsed = parseListing(rawItem());

    expect(parsed).toEqual({
      externalId: '123456',
      title: 'Nike Tech Fleece Hoodie',
      brand: 'Nike',
      size: 'L',
      condition: 'Very good',
      price: 35,
      currency: 'EUR',
      url: 'https://www.vinted.fr/items/123456',
      images: ['https://images.vinted.net/1.jpg'],
      seller: { externalId: '789', username: 'seller1', rating: 4.8, reviews: 120 },
      publishedAt: new Date(1_700_000_000 * 1000).toISOString(),
    });
  });

  it('falls back to the price field when total_item_price is absent', () => {
    const parsed = parseListing(
      rawItem({ total_item_price: undefined, price: { amount: '20', currency_code: 'EUR' } }),
    );

    expect(parsed?.price).toBe(20);
  });

  it('returns null when both price fields are missing', () => {
    expect(parseListing(rawItem({ total_item_price: undefined, price: undefined }))).toBeNull();
  });

  it('returns null when the price amount is not numeric', () => {
    expect(
      parseListing(rawItem({ total_item_price: { amount: 'n/a', currency_code: 'EUR' } })),
    ).toBeNull();
  });

  it('returns null for malformed items missing required fields', () => {
    expect(parseListing({ id: 1 })).toBeNull();
  });

  it('returns a null seller when the user field is absent', () => {
    const parsed = parseListing(rawItem({ user: undefined }));

    expect(parsed?.seller).toBeNull();
  });

  it('returns a null publishedAt when created_at_ts is absent', () => {
    const parsed = parseListing(rawItem({ created_at_ts: undefined }));

    expect(parsed?.publishedAt).toBeNull();
  });

  it('returns an empty images array when photos are absent', () => {
    const parsed = parseListing(rawItem({ photos: undefined }));

    expect(parsed?.images).toEqual([]);
  });
});
