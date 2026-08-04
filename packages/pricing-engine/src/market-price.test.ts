import { describe, expect, it } from 'vitest';
import { estimateMarketPrice } from './market-price.js';

describe('estimateMarketPrice', () => {
  it('averages comparable prices as the base', () => {
    const result = estimateMarketPrice([{ price: 80 }, { price: 100 }, { price: 120 }], {
      brand: null,
      condition: null,
      fallbackPrice: 999,
    });

    expect(result.averageComparablePrice).toBe(100);
    expect(result.comparableCount).toBe(3);
    // No brand/condition adjustment, but 3 comparables still add a demand bonus (3*2%=6% of 100).
    expect(result.estimatedValue).toBe(106);
  });

  it('falls back to the listing price when there are no comparables', () => {
    const result = estimateMarketPrice([], { brand: null, condition: null, fallbackPrice: 42 });

    expect(result.averageComparablePrice).toBeNull();
    expect(result.comparableCount).toBe(0);
    expect(result.estimatedValue).toBe(42);
  });

  it("ignores brand/condition/demand factors with zero comparables — does not fabricate a discount from the listing's own unverified claims", () => {
    const result = estimateMarketPrice([], {
      brand: 'Stone Island',
      condition: 'Neuf avec étiquette',
      fallbackPrice: 50,
    });

    expect(result.estimatedValue).toBe(50);
    expect(result.brandFactor).toBe(0);
    expect(result.conditionFactor).toBe(0);
    expect(result.demandFactor).toBe(0);
  });

  it('applies brand, condition, and demand factors on top of the average', () => {
    const result = estimateMarketPrice([{ price: 100 }], {
      brand: 'Stone Island',
      condition: 'Neuf avec étiquette',
      fallbackPrice: 999,
    });

    // base 100, brandFactor +15, conditionFactor +15 (15% of 100), demandFactor +2 (1 comparable, 2%)
    expect(result.brandFactor).toBe(15);
    expect(result.conditionFactor).toBe(15);
    expect(result.demandFactor).toBe(2);
    expect(result.estimatedValue).toBe(132);
  });

  it('never returns a negative estimated value', () => {
    const result = estimateMarketPrice([{ price: 10 }], {
      brand: null,
      condition: 'Satisfaisant',
      fallbackPrice: 999,
    });

    expect(result.estimatedValue).toBeGreaterThanOrEqual(0);
  });
});
